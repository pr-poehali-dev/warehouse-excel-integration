import { useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';

type InventoryItem = {
  code: string;
  article: string;
  cell: string;
  [key: string]: string;
};

interface FileUploadCardProps {
  fileName: string;
  inventoryLength: number;
  onFileUpload: (data: InventoryItem[], fileName: string) => void;
  onToast: (message: { title: string; description: string; variant?: 'destructive' }) => void;
}

export default function FileUploadCard({ fileName, inventoryLength, onFileUpload, onToast }: FileUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as InventoryItem[];

        const processedData = jsonData.map((item) => {
          const keys = Object.keys(item);
          return {
            code: item[keys[0]] || '',
            article: item[keys[1]] || '',
            cell: item[keys[2]] || '',
            ...item,
          };
        });

        onFileUpload(processedData, file.name);
        
        onToast({
          title: "Файл загружен",
          description: `Обработано ${processedData.length} позиций`,
        });
      } catch (error) {
        onToast({
          title: "Ошибка загрузки",
          description: "Не удалось прочитать файл Excel",
          variant: "destructive",
        });
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.match(/\.(xlsx|xls)$/)) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Upload" size={20} />
          Загрузка данных
        </CardTitle>
        <CardDescription>Перетащите Excel файл или выберите вручную</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon name="FileSpreadsheet" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            {fileName || 'Выберите файл Excel'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Поддерживаются форматы .xlsx и .xls
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline">
            <Icon name="FolderOpen" size={16} className="mr-2" />
            Выбрать файл
          </Button>
        </div>

        {inventoryLength > 0 && (
          <Alert className="mt-4">
            <Icon name="CheckCircle" size={16} />
            <AlertDescription>
              Загружено <strong>{inventoryLength}</strong> позиций из файла <strong>{fileName}</strong>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
