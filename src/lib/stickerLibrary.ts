import { useEffect, useState } from 'react';

const projectId = 'njbtqmsxbyvpwigfceke';
const supabaseUrl = `https://${projectId}.supabase.co`;
const publicAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qYnRxbXN4Ynl2cHdpZ2ZjZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MzczODksImV4cCI6MjA3ODQxMzM4OX0.nY0THq2YU9wrjYsPoxYwXRXczE3Vh7cB1opzAV8c50g';

const STICKER_LIST_URL = `${supabaseUrl}/storage/v1/object/list/competition_files`;
const STICKER_PUBLIC_BASE_URL = `${supabaseUrl}/storage/v1/object/public/competition_files`;

const STICKER_CATEGORY_CONFIG = [
  { id: 'emoji', label: 'Emoji', folder: '1_emoji' },
  { id: 'numbers-and-signs', label: 'Čísla a znaménka', folder: '2_cisla a znamenka' },
  { id: 'dice', label: 'Kostky', folder: '3_kostky' },
  { id: 'geometric-symbols', label: 'Geometrické symboly', folder: '4_geometricke symboly' },
  { id: 'color-symbols', label: 'Barevné symboly', folder: '5_barevne symboly' },
  { id: 'money', label: 'Penízky', folder: '6_penizky' },
  { id: 'other-symbols', label: 'Další symboly', folder: '7_dalsi symboly' },
  { id: 'tables', label: 'Tabulky', folder: '8_tabulky' },
] as const;

export const MATH_STRIP_CATEGORY_ID = 'numbers-and-signs';

export interface StickerItem {
  id: string;
  name: string;
  url: string;
  categoryId: string;
  row: number;
  order: number;
}

export interface StickerRow {
  id: string;
  categoryId: string;
  row: number;
  items: StickerItem[];
}

export interface StickerCategory {
  id: string;
  label: string;
  folder: string;
  rows: StickerRow[];
}

interface StorageListItem {
  name: string;
  id: string | null;
  metadata: {
    mimetype?: string;
  } | null;
}

let stickerCatalogPromise: Promise<StickerCategory[]> | null = null;

function encodeStoragePath(path: string) {
  return path.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}

function buildStickerName(rawName: string) {
  return rawName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseStickerFileName(fileName: string, categoryId: string, folder: string): StickerItem | null {
  const extensionIndex = fileName.lastIndexOf('.');
  const baseName = extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName;
  const extension = extensionIndex >= 0 ? fileName.slice(extensionIndex + 1).toLowerCase() : '';

  if (!['svg', 'png', 'webp', 'jpg', 'jpeg'].includes(extension)) {
    return null;
  }

  const match = baseName.match(/^(.*)_(\d+)_(\d+)_(.+)$/);
  if (!match) {
    return {
      id: `${categoryId}-${baseName}`,
      name: buildStickerName(baseName),
      url: `${STICKER_PUBLIC_BASE_URL}/${encodeStoragePath(`stickers/${folder}/${fileName}`)}`,
      categoryId,
      row: 1,
      order: Number.POSITIVE_INFINITY,
    };
  }

  const [, , rowValue, orderValue, rawLabel] = match;
  if (rawLabel.toLowerCase() === 'bluepin') {
    return null;
  }

  return {
    id: `${categoryId}-${baseName}`,
    name: buildStickerName(rawLabel),
    url: `${STICKER_PUBLIC_BASE_URL}/${encodeStoragePath(`stickers/${folder}/${fileName}`)}`,
    categoryId,
    row: Number(rowValue),
    order: Number(orderValue),
  };
}

async function listStickerFolder(folder: string): Promise<StorageListItem[]> {
  const response = await fetch(STICKER_LIST_URL, {
    method: 'POST',
    headers: {
      apikey: publicAnonKey,
      Authorization: `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prefix: `stickers/${folder}`,
      limit: 200,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Sticker folder load failed: ${response.status}`);
  }

  return (await response.json()) as StorageListItem[];
}

async function fetchStickerCatalog(): Promise<StickerCategory[]> {
  const categories = await Promise.all(
    STICKER_CATEGORY_CONFIG.map(async (config) => {
      const files = await listStickerFolder(config.folder);
      const items = files
        .filter((file) => Boolean(file.id))
        .map((file) => parseStickerFileName(file.name, config.id, config.folder))
        .filter((item): item is StickerItem => Boolean(item))
        .sort((a, b) => {
          if (a.row !== b.row) return a.row - b.row;
          if (a.order !== b.order) return a.order - b.order;
          return a.name.localeCompare(b.name);
        });

      const rowsMap = new Map<number, StickerItem[]>();
      items.forEach((item) => {
        const rowItems = rowsMap.get(item.row) ?? [];
        rowItems.push(item);
        rowsMap.set(item.row, rowItems);
      });

      const rows: StickerRow[] = Array.from(rowsMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([row, rowItems]) => ({
          id: `${config.id}-${row}`,
          categoryId: config.id,
          row,
          items: rowItems,
        }));

      return {
        id: config.id,
        label: config.label,
        folder: config.folder,
        rows,
      };
    }),
  );

  return categories.filter((category) => category.rows.length > 0 && category.id !== MATH_STRIP_CATEGORY_ID);
}

export function loadStickerCatalog() {
  if (!stickerCatalogPromise) {
    stickerCatalogPromise = fetchStickerCatalog();
  }
  return stickerCatalogPromise;
}

export function useStickerCatalog() {
  const [categories, setCategories] = useState<StickerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    loadStickerCatalog()
      .then((result) => {
        if (cancelled) return;
        setCategories(result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Sticker load failed');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
}
