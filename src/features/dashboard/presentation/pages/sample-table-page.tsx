import * as React from "react";
import { EditTable, type ColumnDef } from "@shared/components/table/edit-table";
import { BasePage } from "@core/pages/base-page";
import { PageContainer } from "@shared/components/ui/page-container";
import { PageToolbar } from "@shared/components/ui/page-toolbar";
import { SectionCard } from "@shared/components/ui/section-card";
import { Spacer } from "@shared/components/ui/spacer";
type Product = {
  id: number;
  name: string;
  colorInfo: { color: string; text: string; };
  price: number;
  imageUrl: string;
  tags: (string | { color?: string; text: string })[];
  createdAt: string; // ISO
};

// Mock fetch API (server-side paging + sorting)
async function fetchProducts(opts: {
  page: number; size: number; orderBy?: string | null; direction?: "asc" | "desc";
}): Promise<{ items: Product[]; total: number; }> {
  // Demo dataset
  const all: Product[] = Array.from({ length: 137 }).map((_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    colorInfo: [
      { color: "#FF6B6B", text: "#FF6B6B" },
      { color: "#4ECDC4", text: "#4ECDC4" },
      { color: "#FFD93D", text: "#FFD93D" },
      { color: "#A29BFE", text: "#A29BFE" },
      { color: "#55EFC4", text: "#55EFC4" },
    ][i % 5],
    price: Math.round(100000 + Math.random() * 900000),
    imageUrl: `https://picsum.photos/seed/p${i}/200/120`,
    tags: ["fresh", "organic", "premium", "sale", { color: "#E74C3C", text: "Hot" }].slice(0, (i % 5) + 1),
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));

  // sort server-side
  const { orderBy, direction } = opts;
  if (orderBy) {
    const compare = (a: Product, b: Product) => {
      const av = (a as any)[orderBy], bv = (b as any)[orderBy];
      const isDate = (v: unknown) => typeof v === "string" && !isNaN(Date.parse(v as string));
      let res = 0;
      if (typeof av === "number" && typeof bv === "number") res = av - bv;
      else if (isDate(av) && isDate(bv)) res = new Date(av).getTime() - new Date(bv).getTime();
      else res = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { sensitivity: "base" });
      return direction === "asc" ? res : -res;
    };
    all.sort(compare);
  }

  const start = opts.page * opts.size;
  const end = start + opts.size;
  const items = all.slice(start, end);
  return new Promise(resolve => setTimeout(() => resolve({ items, total: all.length }), 300));
}

export default function ExamplePage() {
  const [rows, setRows] = React.useState<Product[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [loading, setLoading] = React.useState(false);

  // server-side sort state
  const [orderBy, setOrderBy] = React.useState<string | null>("id");
  const [direction, setDirection] = React.useState<"asc" | "desc">("asc");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchProducts({ page, size, orderBy, direction });
      setRows(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [page, size, orderBy, direction]);

  React.useEffect(() => { load(); }, [load]);

  const columns: ColumnDef<Product>[] = [
    { key: "id", header: "ID", width: 80, type: "number", sortable: true, stickyLeft: true },
    { key: "name", header: "Name", width: 220, sortable: true, stickyLeft: true },
    { key: "colorInfo", header: "Color", width: 160, type: "color", sortable: true },
    { key: "imageUrl", header: "Image", width: 140, type: "image" },
    { key: "tags", header: "Tags", width: 260, type: "chips" },
    {
      key: "price",
      header: "Price (₫)",
      width: 140,
      type: "number",
      sortable: true,
      render: (r) => new Intl.NumberFormat("vi-VN").format(r.price),
    },
    {
      key: "createdAt",
      header: "Created",
      width: 180,
      type: "date",
      sortable: true,
      render: (r) => new Date(r.createdAt).toLocaleString("vi-VN"),
      stickyRight: true, // thử freeze 1 cột bên phải
    },
  ];

  return (
    <BasePage>
      <PageContainer>
        <PageToolbar
          title="Sample Product Table"
          subtitle="Demonstration of EditTable with server-side paging and sorting"
          actions={
            <>
            </>
          }
        />

        <SectionCard>
          <EditTable<Product>
            rows={rows}
            columns={columns}
            page={page}
            pageSize={size}
            total={total}
            loading={loading}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => { setPage(0); setSize(s); }}
            onView={(r) => console.info("View:", r)}
            onEdit={(r) => console.info("Edit:", r)}
            onDelete={(r) => console.info("Delete:", r)}
            stickyHeader
            dense
            stickyTopOffset={0}
            // server-side sort
            sortBy={orderBy}
            sortDirection={direction}
            onSortChange={(by, dir) => {
              setOrderBy(by);
              setDirection(dir);
              setPage(0);
            }}
          />
        </SectionCard>

        <Spacer />

        <SectionCard sx={{ color: "text.secondary", fontSize: 12 }}>
          Tips:
          <ul style={{ marginTop: 4 }}>
            <li>Muốn freeze nhiều cột trái/phải: đặt <code>stickyLeft</code>/<code>stickyRight</code> và **khai báo width cố định** cho từng cột.</li>
            <li>Có AppBar cố định? Dùng <code>stickyTopOffset</code> để đẩy header xuống đúng vị trí.</li>
            <li>Muốn custom cell phức tạp: dùng <code>render</code> hoặc <code>type="custom"</code> + <code>render</code>.</li>
            <li>Muốn sort client-side: bỏ <code>onSortChange</code>/<code>sortBy</code>/<code>sortDirection</code>, component sẽ tự sort local.</li>
          </ul>
        </SectionCard>
      </PageContainer>
    </BasePage>
  );
}
