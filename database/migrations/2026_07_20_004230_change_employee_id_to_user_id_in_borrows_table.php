use App\Models\Employee;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->nullable()
                ->after('employee_id')
                ->constrained()
                ->restrictOnDelete();
        });

        Employee::with('user')->chunk(100, function ($employees) {
            foreach ($employees as $employee) {
                DB::table('borrows')
                    ->where('employee_id', $employee->id)
                    ->update([
                        'user_id' => $employee->user_id,
                    ]);
            }
        });

        Schema::table('borrows', function (Blueprint $table) {
            $table->dropForeign(['employee_id']);
            $table->dropColumn('employee_id');
        });

        DB::statement('ALTER TABLE borrows ALTER COLUMN user_id SET NOT NULL');
    }

    public function down(): void
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->foreignId('employee_id')
                ->nullable()
                ->constrained()
                ->restrictOnDelete();
        });

        Employee::chunk(100, function ($employees) {
            foreach ($employees as $employee) {
                DB::table('borrows')
                    ->where('user_id', $employee->user_id)
                    ->update([
                        'employee_id' => $employee->id,
                    ]);
            }
        });

        Schema::table('borrows', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });

        DB::statement('ALTER TABLE borrows ALTER COLUMN employee_id SET NOT NULL');
    }
};