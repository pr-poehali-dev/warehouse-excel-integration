import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type InventoryItem = {
  code: string;
  article: string;
  cell: string;
  [key: string]: string;
};

export default function Index() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [fileName, setFileName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
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

        setInventory(processedData);
        setFilteredItems(processedData);
        
        toast({
          title: "Файл загружен",
          description: `Обработано ${processedData.length} позиций`,
        });
      } catch (error) {
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось прочитать файл Excel",
          variant: "destructive",
        });
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredItems(inventory);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const results = inventory.filter(
      (item) =>
        item.code?.toLowerCase().includes(lowerQuery) ||
        item.article?.toLowerCase().includes(lowerQuery)
    );

    setFilteredItems(results);

    if (query.trim() && !searchHistory.includes(query.trim())) {
      const updatedHistory = [query.trim(), ...searchHistory].slice(0, 10);
      setSearchHistory(updatedHistory);
    }
  };

  const handleScanToggle = async () => {
    if (isScanning) {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (err) {
          console.error('Error stopping scanner:', err);
        }
      }
      setIsScanning(false);
    } else {
      setIsScanning(true);
    }
  };

  useEffect(() => {
    if (isScanning) {
      const startScanner = async () => {
        try {
          const html5QrCode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              handleSearch(decodedText);
              handleScanToggle();
              toast({
                title: "Штрихкод отсканирован",
                description: `Найдено: ${decodedText}`,
              });
            },
            (errorMessage) => {
              console.log('Scanning...', errorMessage);
            }
          );
        } catch (err) {
          toast({
            title: "Ошибка камеры",
            description: "Не удалось получить доступ к камере",
            variant: "destructive",
          });
          setIsScanning(false);
        }
      };
      startScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => console.error(err));
      }
    };
  }, [isScanning]);

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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary p-3 rounded-lg">
            <Icon name="Package" className="text-primary-foreground" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Складской учёт</h1>
            <p className="text-muted-foreground">Поиск товаров по артикулу и коду</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
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

              {inventory.length > 0 && (
                <Alert className="mt-4">
                  <Icon name="CheckCircle" size={16} />
                  <AlertDescription>
                    Загружено <strong>{inventory.length}</strong> позиций из файла <strong>{fileName}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Scan" size={20} />
                Сканер штрихкодов
              </CardTitle>
              <CardDescription>Быстрый поиск через камеру</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleScanToggle}
                className={`w-full ${isScanning ? 'animate-pulse-ring' : ''}`}
                variant={isScanning ? 'default' : 'outline'}
                size="lg"
              >
                <Icon name={isScanning ? 'ScanLine' : 'Camera'} size={20} className="mr-2" />
                {isScanning ? 'Сканирование...' : 'Начать сканирование'}
              </Button>

              {searchHistory.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">История поиска</p>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((query, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleSearch(query)}
                      >
                        {query}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Search" size={20} />
              Поиск товаров
            </CardTitle>
            <CardDescription>Введите артикул или код для поиска</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по артикулу или коду..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setFilteredItems(inventory);
                  }}
                >
                  <Icon name="X" size={16} />
                </Button>
              )}
            </div>

            {inventory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Package" size={64} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg">Загрузите Excel файл для начала работы</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="SearchX" size={64} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg">Ничего не найдено</p>
                <p className="text-sm">Попробуйте изменить запрос</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Код</TableHead>
                      <TableHead>Артикул</TableHead>
                      <TableHead className="text-right">
                        <Badge variant="default">Ячейка</Badge>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono">{item.code}</TableCell>
                        <TableCell className="font-medium">{item.article}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-bold text-lg">
                            {item.cell}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {filteredItems.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground text-center">
                Показано {filteredItems.length} из {inventory.length} позиций
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isScanning} onOpenChange={(open) => !open && handleScanToggle()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Camera" size={20} />
              Сканирование штрихкода
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
            <p className="text-sm text-muted-foreground text-center">
              Наведите камеру на штрихкод или QR-код
            </p>
            <Button onClick={handleScanToggle} variant="outline" className="w-full">
              Отменить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}