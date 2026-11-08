import "./styles/main.css";
import { initLangMenu } from "./client/lang-menu";
import { initLangSuggest } from "./client/lang-suggest";
import { initTheme } from "./client/theme";
import { initWidget } from "./client/widget";

initTheme();
initLangMenu();
initLangSuggest();
void initWidget();

// Only the downloads page has the table, so only it loads the dialog code.
if (document.getElementById("downloads-table")) {
  void import("./client/version-dialog").then((m) => m.initVersionDialog());
}
