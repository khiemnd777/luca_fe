import React from "react";
import { BasePage } from "@core/pages/base-page";
import { PageContainer } from "@root/shared/components/ui/page-container";
import { PageToolbar } from "@root/shared/components/ui/page-toolbar";
import { SectionCard } from "@root/shared/components/ui/section-card";
import type { AutoFormRef } from "@root/core/form/form.types";
import { AutoGrid } from "@shared/components/ui/auto-grid";
import { Section } from "@shared/components/ui/section";
import { useAuthStore } from "@store/auth-store";
import { LogoutRounded } from "@mui/icons-material";
import { Spacer } from "@root/shared/components/ui/spacer";
import { AutoForm } from "@root/core/form/auto-form";
import ChangeCircleOutlinedIcon from '@mui/icons-material/ChangeCircleOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { SafeButton } from "@shared/components/button/safe-button";

export default function AccountPage() {
  const logout = useAuthStore((s) => s.logout);
  const formAccountRef = React.useRef<AutoFormRef>(null);
  const formAccountChangePasswordRef = React.useRef<AutoFormRef>(null);
  return (
    <>
      <BasePage>
        <PageContainer>
          <PageToolbar title="Tài khoản" subtitle="Chỉnh sửa thông tin tài khoản đăng nhập."
            actions={
              <>
                <SafeButton variant="contained" color="error" startIcon={<LogoutRounded />} onClick={async () => await logout()}>
                  Đăng xuất
                </SafeButton>
              </>
            }
          />
          <AutoGrid>
            {/* Left */}
            <Section>
              <SectionCard title={"Thông tin tài khoản"} extra={
                <SafeButton variant="contained" startIcon={<SaveOutlinedIcon />} onClick={() => formAccountRef.current?.submit()}>
                  Lưu
                </SafeButton>
              }>
                <AutoForm name="account" ref={formAccountRef} />
              </SectionCard>

              <Spacer />

              <SectionCard title={"Đổi mật khẩu"} extra={
                <SafeButton variant="contained" startIcon={<ChangeCircleOutlinedIcon />} onClick={() => formAccountChangePasswordRef.current?.submit()}>
                  Đổi
                </SafeButton>
              }>
                <AutoForm name="account-change-password" ref={formAccountChangePasswordRef} />
              </SectionCard>
            </Section>

            {/* Right */}
            <Section />

          </AutoGrid>
        </PageContainer>
      </BasePage>
    </>
  );
}
