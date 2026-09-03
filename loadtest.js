import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ───────────────────────────────────────────
const searchDuration = new Trend('asset_search', true);
const createDuration = new Trend('asset_create', true);
const loginDuration = new Trend('login', true);
const createSuccess = new Counter('asset_create_success');
const createFail = new Counter('asset_create_fail');

// ─── Config ───────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

const EMPLOYEES = [
    { email: 'loademp1@test.com', password: 'Password123!' },
    { email: 'loademp2@test.com', password: 'Password123!' },
    { email: 'loademp3@test.com', password: 'Password123!' },
    { email: 'loademp4@test.com', password: 'Password123!' },
    { email: 'loademp5@test.com', password: 'Password123!' },
];

const CUSTODIANS = [
    { email: 'loadcust1@test.com', password: 'Password123!' },
    { email: 'loadcust2@test.com', password: 'Password123!' },
    { email: 'loadcust3@test.com', password: 'Password123!' },
];

const SEARCH_QUERIES = ['laptop', 'monitor', 'chair', 'printer', ''];
const CATEGORIES = ['All', '1', '2', '3'];

const ASSET_TYPES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CONDITIONS = [1, 2, 3, 4];

// ─── Options ──────────────────────────────────────────────────
export const options = {
    scenarios: {
        employee_search: {
            executor: 'constant-vus',
            vus: 5,
            duration: '60s',
            exec: 'employeeSearch',
        },
        custodian_work: {
            executor: 'constant-vus',
            vus: 3,
            duration: '60s',
            exec: 'custodianWork',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate<0.01'],
        asset_search: ['p(95)<400'],
        asset_create: ['p(95)<800'],
        login: ['p(95)<1000'],
    },
};

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Get CSRF token from /loadtest/token endpoint.
 * Also establishes session cookie that k6 jar will reuse for subsequent requests.
 */
function getCsrfToken() {
    var res = http.get(BASE_URL + '/loadtest/token', {
        headers: { Accept: 'application/json' },
        tags: { name: 'GET /loadtest/token' },
    });

    try {
        var body = JSON.parse(res.body);

        return body.token || '';
    } catch (e) {
        return '';
    }
}

/**
 * Login a user. Uses /loadtest/token to get CSRF token, sends as _token in JSON body.
 */
function login(user) {
    var token = getCsrfToken();

    if (!token) {
        console.error('[' + user.email + '] Failed to get CSRF token');

        return false;
    }

    // POST /login with credentials + CSRF token in body
    var res = http.post(
        BASE_URL + '/login',
        JSON.stringify({
            email: user.email,
            password: user.password,
            _token: token,
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/html',
            },
            redirects: 0,
            tags: { name: 'POST /login' },
        }
    );

    // 302 = success (redirect to dashboard), 200 = force-change-password page
    var success = res.status === 302 || res.status === 200;

    if (!success) {
        console.error(
            '[' + user.email + '] Login failed: ' + res.status + ' ' + res.status_text
        );
    }

    return success;
}

// ─── Scenario: Employee Asset Search ──────────────────────────
export function employeeSearch() {
    const vuId = __VU;
    const user = EMPLOYEES[(vuId - 1) % EMPLOYEES.length];

    group('Employee Login', () => {
        const start = Date.now();
        const ok = login(user);
        loginDuration.add(Date.now() - start);

        if (!ok) {
            console.error(`VU ${vuId}: Login failed, skipping iteration`);
            sleep(1);

            return;
        }
    });

    group('Employee Asset Search', () => {
        for (let i = 0; i < 12; i++) {
            const query = SEARCH_QUERIES[i % SEARCH_QUERIES.length];
            const category = CATEGORIES[i % CATEGORIES.length];

            var qs = 'per_page=10';

            if (query) {
qs += '&search=' + encodeURIComponent(query);
}

            if (category !== 'All') {
qs += '&category=' + encodeURIComponent(category);
}

            var url = BASE_URL + '/employee/assets?' + qs;

            const res = http.get(url, {
                headers: {
                    Accept: 'text/html',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                tags: { name: 'GET /employee/assets' },
            });

            const ok = check(res, {
                'search: status 200': (r) => r.status === 200,
                'search: has body': (r) => r.body && r.body.length > 0,
            });

            searchDuration.add(res.timings.duration);

            if (!ok) {
                console.error(
                    `VU ${vuId} search failed: ${res.status} query="${query}" cat="${category}"`
                );
            }

            sleep(Math.random() * 0.5 + 0.3);
        }
    });
}

// ─── Scenario: Custodian Create + Search ──────────────────────
export function custodianWork() {
    const vuId = __VU;
    const user = CUSTODIANS[(vuId - 1) % CUSTODIANS.length];

    group('Custodian Login', () => {
        const start = Date.now();
        const ok = login(user);
        loginDuration.add(Date.now() - start);

        if (!ok) {
            console.error(`VU ${vuId}: Login failed, skipping iteration`);
            sleep(1);

            return;
        }
    });

    for (let i = 0; i < 10; i++) {
        // ── Read: Search assets ──
        if (i % 3 !== 0) {
            group('Custodian Search', () => {
                const query = SEARCH_QUERIES[i % SEARCH_QUERIES.length];

                var res = http.get(
                    BASE_URL + '/custodian/assets?search=' + encodeURIComponent(query) + '&per_page=10',
                    {
                        headers: {
                            Accept: 'text/html',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        tags: { name: 'GET /custodian/assets' },
                    }
                );

                check(res, {
                    'custodian search: status 200': (r) => r.status === 200,
                });

                searchDuration.add(res.timings.duration);
            });

            sleep(Math.random() * 0.5 + 0.3);
            continue;
        }

        // ── Write: Create asset ──
        group('Custodian Create Asset', () => {
            // Step 1: GET CSRF token
            var token = getCsrfToken();

            if (!token) {
                console.error('VU ' + vuId + ' iter ' + i + ': CSRF token fetch failed');
                createFail.add(1);

                return;
            }

            // Step 2: POST new asset
            var assetName = 'LoadTest-' + vuId + '-' + i + '-' + Date.now();
            var payload = JSON.stringify({
                name: assetName,
                category_id: 1,
                asset_type_id: ASSET_TYPES[Math.floor(Math.random() * ASSET_TYPES.length)],
                acquisition_date: '2026-01-15',
                status: 'available',
                condition: CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)],
                _token: token,
            });

            var start = Date.now();
            var res = http.post(BASE_URL + '/custodian/assets', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/html',
                },
                redirects: 0,
                tags: { name: 'POST /custodian/assets' },
            });
            createDuration.add(Date.now() - start);

            const ok = check(res, {
                'create: status 302 or 200': (r) =>
                    r.status === 302 || r.status === 200,
            });

            if (ok) {
                createSuccess.add(1);
            } else {
                createFail.add(1);
                console.error(
                    `VU ${vuId} create failed: ${res.status} ${res.body ? res.body.substring(0, 200) : 'no body'}`
                );
            }
        });

        sleep(Math.random() * 0.8 + 0.5);
    }
}

// ─── Summary ──────────────────────────────────────────────────
export function handleSummary(data) {
    const p95 = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0;
    const p99 = data.metrics.http_req_duration?.values?.['p(99)'] ?? 0;
    const failRate =
        (data.metrics.http_req_failed?.values?.rate ?? 0) * 100;
    const totalReqs = data.metrics.http_reqs?.values?.count ?? 0;

    console.log('\n' + '═'.repeat(50));
    console.log('  LOAD TEST RESULTS');
    console.log('═'.repeat(50));
    console.log(`  Total Requests:    ${totalReqs}`);
    console.log(`  Response p95:      ${p95.toFixed(1)}ms`);
    console.log(`  Response p99:      ${p99.toFixed(1)}ms`);
    console.log(`  Error Rate:        ${failRate.toFixed(2)}%`);

    const searchP95 =
        data.metrics.asset_search?.values?.['p(95)'] ?? 'N/A';
    const createP95 =
        data.metrics.asset_create?.values?.['p(95)'] ?? 'N/A';
    const loginP95 =
        data.metrics.login?.values?.['p(95)'] ?? 'N/A';

    console.log(`  Search p95:        ${typeof searchP95 === 'number' ? searchP95.toFixed(1) + 'ms' : searchP95}`);
    console.log(`  Create p95:        ${typeof createP95 === 'number' ? createP95.toFixed(1) + 'ms' : createP95}`);
    console.log(`  Login p95:         ${typeof loginP95 === 'number' ? loginP95.toFixed(1) + 'ms' : loginP95}`);

    const createOk = data.metrics.asset_create_success?.values?.count ?? 0;
    const createFailCount = data.metrics.asset_create_fail?.values?.count ?? 0;
    console.log(`  Assets Created:    ${createOk} (${createFailCount} failed)`);
    console.log('═'.repeat(50) + '\n');

    return {};
}
