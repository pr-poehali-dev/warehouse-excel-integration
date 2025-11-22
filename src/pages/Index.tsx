import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Html5Qrcode } from 'html5-qrcode';
import FileUploadCard from '@/components/warehouse/FileUploadCard';
import ScannerCard from '@/components/warehouse/ScannerCard';
import SearchTable from '@/components/warehouse/SearchTable';
import ScannerDialog from '@/components/warehouse/ScannerDialog';

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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (data: InventoryItem[], name: string) => {
    setInventory(data);
    setFilteredItems(data);
    setFileName(name);
  };

  const handleExportToExcel = () => {
    if (filteredItems.length === 0) {
      toast({
        title: "Нет данных",
        description: "Нечего экспортировать",
        variant: "destructive",
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredItems);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Результаты");
    
    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `складской_учет_${timestamp}.xlsx`);
    
    toast({
      title: "Экспорт завершен",
      description: `Экспортировано ${filteredItems.length} позиций`,
    });
  };

  const handleCellEdit = (index: number, newValue: string) => {
    const updatedInventory = [...inventory];
    const itemIndex = inventory.findIndex(item => item === filteredItems[index]);
    
    if (itemIndex !== -1) {
      updatedInventory[itemIndex] = {
        ...updatedInventory[itemIndex],
        cell: newValue,
      };
      setInventory(updatedInventory);
      
      const updatedFiltered = [...filteredItems];
      updatedFiltered[index] = {
        ...updatedFiltered[index],
        cell: newValue,
      };
      setFilteredItems(updatedFiltered);
      
      toast({
        title: "Ячейка обновлена",
        description: `Новое значение: ${newValue}`,
      });
    }
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
          <FileUploadCard
            fileName={fileName}
            inventoryLength={inventory.length}
            onFileUpload={handleFileUpload}
            onToast={toast}
          />

          <ScannerCard
            isScanning={isScanning}
            searchHistory={searchHistory}
            onScanToggle={handleScanToggle}
            onHistoryClick={handleSearch}
          />
        </div>

        <SearchTable
          inventory={inventory}
          filteredItems={filteredItems}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          onCellEdit={handleCellEdit}
          onExport={handleExportToExcel}
        />
      </div>

      <ScannerDialog
        isOpen={isScanning}
        onClose={handleScanToggle}
      />
    </div>
  );
}
