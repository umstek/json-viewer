import { Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  type ExportFormat,
  exportData,
  formatLabels,
} from '../../utils/export-formats';

export interface ExportButtonProps {
  /**
   * The data to export
   */
  data: unknown;

  /**
   * Base filename for the exported file (without extension)
   * @default 'data'
   */
  filename?: string;

  /**
   * Callback when export is triggered
   */
  onExport?: (format: ExportFormat) => void;

  /**
   * Whether to show the export button as an icon or with text
   * @default 'icon'
   */
  variant?: 'icon' | 'text';
}

/**
 * Export button component that allows downloading JSON data in various formats
 * Supports JSON (formatted/minified), YAML, and CSV formats
 */
export function ExportButton({
  data,
  filename = 'data',
  onExport,
  variant = 'icon',
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);

      // Call export function
      exportData(data, format, filename);

      // Notify parent component
      onExport?.(format);

      // Close popover after successful export
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      // You could add toast notification here
      alert(`Export failed: ${(error as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const formats: ExportFormat[] = ['json', 'json-minified', 'yaml', 'csv'];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="outline" size="icon" title="Export data">
            <Download className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" title="Export data">
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Export Format</h4>
            <p className="text-muted-foreground text-xs">
              Choose a format to download the data
            </p>
          </div>
          <div className="grid gap-2">
            {formats.map((format) => (
              <Button
                key={format}
                variant="outline"
                size="sm"
                onClick={() => handleExport(format)}
                disabled={isExporting}
                className="justify-start"
              >
                {formatLabels[format]}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
