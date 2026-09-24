<?php

namespace App\Support\Spreadsheet;

use OpenSpout\Common\Entity\Row;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use OpenSpout\Writer\CSV\Writer as CsvWriter;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;

class SpreadsheetParser
{
    /**
     * Reads the first sheet of a spreadsheet and returns the header row plus
     * every populated data row below it.
     *
     * @return array{0: list<mixed>|null, 1: list<list<mixed>>}
     */
    public static function parse(string $path, string $extension): array
    {
        $reader = $extension === 'csv' ? new CsvReader : new XlsxReader;

        $reader->open($path);

        $headerRow = null;
        $rows = [];

        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $cells = $row->toArray();

                if ($headerRow === null) {
                    $headerRow = $cells;

                    continue;
                }

                if ($row->isEmpty()) {
                    $hasContent = collect($cells)
                        ->contains(fn ($value) => $value !== null && trim((string) $value) !== '');

                    if (! $hasContent) {
                        continue;
                    }
                }

                $rows[] = $cells;
            }

            break; // only read the first sheet
        }

        $reader->close();

        return [$headerRow, $rows];
    }

    /**
     * Normalizes a requested download format to xlsx or csv.
     */
    public static function format(string $requested): string
    {
        $format = strtolower($requested);

        return in_array($format, ['xlsx', 'csv'], true) ? $format : 'xlsx';
    }

    /**
     * Writes a single header row to a temporary xlsx/csv file and returns the
     * temp file path.
     */
    public static function writeTemplate(array $headers, string $format, string $prefix): string
    {
        $tempPath = sys_get_temp_dir()
            .DIRECTORY_SEPARATOR
            .$prefix
            .uniqid()
            .'.'
            .$format;

        $writer = $format === 'csv' ? new CsvWriter : new XlsxWriter;
        $writer->openToFile($tempPath);
        $writer->addRow(Row::fromValues($headers));
        $writer->close();

        return $tempPath;
    }
}
