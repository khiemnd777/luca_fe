import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import OneColumnPage from "@root/core/pages/one-column-page";
import DataObjectIcon from '@mui/icons-material/DataObject';

const mod: ModuleDescriptor = {
  id: "metadata",
  routes: [
    {
      key: "metadata-collections",
      permissions: ["privilege.metadata"],
      label: "Metadata",
      title: "Metadata",
      path: "/metadata",
      element: <OneColumnPage />,
      icon: <DataObjectIcon />,
      priority: 1,
      children: [
        {
          hidden: true,
          key: "metadata-fields",
          permissions: ["privilege.metadata"],
          title: "Collection",
          path: "/metadata/collection/:id",
          element: <OneColumnPage />,
          icon: <DataObjectIcon />,
          priority: 1,
        },
      ],
    },
  ],
};

registerModule(mod);
