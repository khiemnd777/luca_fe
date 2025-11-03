import { Typography, Button, Stack, Paper } from "@mui/material";
import { BasePage } from "@core/pages/base-page";

export default function StaffPstafage() {
  return (
    <>
      <BasePage>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700} textTransform={"uppercase"}>
            Nhân viên
          </Typography>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1">
              At posse impedit vis, in ignota malorum pro. Vis ipsum animal disputando ea, doctus impedit ei sea.
            </Typography>
            <Typography variant="body2">
              旅ロ京青利セムレ弱改フヨス波府かばぼ意送でぼ調掲察たス日西重ケアナ住橋ユムミク順待ふかんぼ人奨貯鏡すびそ。
            </Typography>
            <Typography variant="body2">
              국민경제의 발전을 위한 중요정책의 수립에 관하여 대통령의 자문에 응하기 위하여 국민경제자문회의를 둘 수 있다.
            </Typography>
            <Typography variant="body2">
              Λορεμ ιπσθμ δολορ σιτ αμετ, μει ιδ νοvθμ φαβελλασ πετεντιθμ vελ.
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }}>
              Action
            </Button>
          </Paper>
        </Stack>
      </BasePage>
    </>
  );
}
