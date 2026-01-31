import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import Browse from "./pages/Browse";
import Search from "./pages/Search";
import Leaderboard from "./pages/Leaderboard";
import Video from "./pages/Video";
import Friends from "./pages/Friends";
import Settings from "./pages/Settings";
import Callback from "./pages/Callback";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/search" element={<Search />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/video/:id" element={<Video />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/settings/profile" element={<Settings />} />
        <Route path="/callback" element={<Callback />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
