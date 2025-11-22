import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface ScannerCardProps {
  isScanning: boolean;
  searchHistory: string[];
  onScanToggle: () => void;
  onHistoryClick: (query: string) => void;
}

export default function ScannerCard({ isScanning, searchHistory, onScanToggle, onHistoryClick }: ScannerCardProps) {
  return (
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
          onClick={onScanToggle}
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
                  onClick={() => onHistoryClick(query)}
                >
                  {query}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
