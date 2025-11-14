import { registerSlot } from "@core/module/registry";
import SearchBox from "@core/search/search-box";
import type { SearchModel } from "@core/search/search.model";
import { navigate } from "@core/navigation/navigate";
import { Box } from "@mui/material";

function SearchBoxWidget() {
  const handleSelect = (item: SearchModel) => {
    switch (item.entityType) {
      case "staff":
        navigate(`/staff/${item.entityId}`);
        break;
      default:
        navigate('/');
    }
  };

  return (
    <>
      <Box>
        <SearchBox
          placeholder="Tìm kiếm theo tên sản phẩm, đơn hàng, vật tư, nhân sự và nha khoa..."
          onSelect={handleSelect}
          minChars={2}
          debounceMs={300}
          autoFocus
          fullWidth
        />
      </Box>
    </>
  );
}

registerSlot({
  id: "search",
  name: "search:left",
  render: () => <SearchBoxWidget />,
})
