import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Share2,
  Twitter,
  Facebook,
  MessageCircle,
  Mail,
  Download,
  FileJson,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  shareToTwitter,
  shareToFacebook,
  shareToWhatsApp,
  shareToEmail,
  copyBookLink,
  exportBookAsJSON,
  exportBookAsTXT,
  downloadReadingCard,
} from '@/lib/bookExport';

interface ShareMenuProps {
  book: Book;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const ShareMenu = ({ book, variant = 'ghost', size = 'icon' }: ShareMenuProps) => {
  const handleShare = (platform: string, action: () => void) => {
    try {
      action();
      toast.success(`Shared to ${platform}`);
    } catch (error) {
      toast.error(`Failed to share to ${platform}`);
    }
  };

  const handleExport = (format: string, action: () => void) => {
    try {
      action();
      toast.success(`Exported as ${format}`);
    } catch (error) {
      toast.error(`Failed to export as ${format}`);
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyBookLink(book);
      toast.success('Link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Share Book</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleShare('Twitter', () => shareToTwitter(book))}>
          <Twitter className="h-4 w-4 mr-2" />
          Share on Twitter
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleShare('Facebook', () => shareToFacebook(book))}>
          <Facebook className="h-4 w-4 mr-2" />
          Share on Facebook
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleShare('WhatsApp', () => shareToWhatsApp(book))}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Share on WhatsApp
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleShare('Email', () => shareToEmail(book))}>
          <Mail className="h-4 w-4 mr-2" />
          Share via Email
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleCopyLink}>
          <LinkIcon className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Export</DropdownMenuLabel>

        <DropdownMenuItem onClick={() => handleExport('JSON', () => exportBookAsJSON(book))}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('TXT', () => exportBookAsTXT(book))}>
          <FileText className="h-4 w-4 mr-2" />
          Export as TXT
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('Image', () => downloadReadingCard(book))}>
          <ImageIcon className="h-4 w-4 mr-2" />
          Download Reading Card
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareMenu;
