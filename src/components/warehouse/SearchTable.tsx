import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';

type InventoryItem = {
  code: string;
  article: string;
  cell: string;
  [key: string]: string;
};

interface SearchTableProps {
  inventory: InventoryItem[];
  filteredItems: InventoryItem[];
  searchQuery: string;
  onSearch: (query: string) => void;
  onCellEdit: (index: number, newValue: string) => void;
  onExport: () => void;
}

export default function SearchTable({ 
  inventory, 
  filteredItems, 
  searchQuery, 
  onSearch, 
  onCellEdit,
  onExport 
}: SearchTableProps) {
  const [editingCell, setEditingCell] = useState<{index: number, value: string} | null>(null);

  const handleCellEdit = (index: number, newValue: string) => {
    onCellEdit(index, newValue);
    setEditingCell(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Search" size={20} />
              Поиск товаров
            </CardTitle>
            <CardDescription>Введите артикул или код для поиска</CardDescription>
          </div>
          {filteredItems.length > 0 && (
            <Button onClick={onExport} variant="outline" className="gap-2">
              <Icon name="Download" size={16} />
              Экспорт
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по артикулу или коду..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => onSearch('')}
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
                      {editingCell?.index === idx ? (
                        <div className="flex gap-2 justify-end items-center">
                          <Input
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({index: idx, value: e.target.value})}
                            className="w-24 text-right"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellEdit(idx, editingCell.value);
                              } else if (e.key === 'Escape') {
                                setEditingCell(null);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleCellEdit(idx, editingCell.value)}
                          >
                            <Icon name="Check" size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCell(null)}
                          >
                            <Icon name="X" size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end items-center">
                          <Badge variant="outline" className="font-bold text-lg">
                            {item.cell}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingCell({index: idx, value: item.cell})}
                          >
                            <Icon name="Pencil" size={14} />
                          </Button>
                        </div>
                      )}
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
  );
}
