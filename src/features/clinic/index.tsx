import type { ModuleDescriptor } from "@core/module/types";
import { registerModule } from "@core/module/registry";
import EmergencyIcon from '@mui/icons-material/Emergency';

const mod: ModuleDescriptor = {
  id: "clinic",
  routes: [
    {
      key: "clinic",
      permissions: ["clinic.view"],
      label: "Nha khoa",
      title: "Nha khoa",
      subtitle: "Cơ sở y tế chuyên khám, chẩn đoán và điều trị các vấn đề về răng, nướu và khoang miệng.",
      path: "/clinic",
      icon: <EmergencyIcon />,
      priority: 94,
    },
  ],
};

registerModule(mod);
