import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface ScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScannerDialog({ isOpen, onClose }: ScannerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
          <Button onClick={onClose} variant="outline" className="w-full">
            Отменить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
