import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { useSubdomain } from "./hooks/useSubdomain";

import Index from "./pages/Index";
import Browse from "./pages/Browse";
import Search from "./pages/Search";
import Leaderboard from "./pages/Leaderboard";
import Video from "./pages/Video";
import Embed from "./pages/Embed";
import Friends from "./pages/Friends";
import Settings from "./pages/Settings";
import MySpaceSettings from "./pages/MySpaceSettings";
import Messages from "./pages/Messages";
import Callback from "./pages/Callback";
import { NIP19Page } from "./pages/NIP19Page";
import Profile from "./pages/Profile";
import ClaimName from "./pages/ClaimName";
import NotFound from "./pages/NotFound";

/**
 * Router component that handles subdomain-based profile routing
 */
function SubdomainAwareRouter() {
  const { isSubdomain, subdomain, pubkey, isUnclaimed } = useSubdomain();

  // If we're on a registered user's subdomain, show their profile
  if (isSubdomain && pubkey && subdomain) {
    return (
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* On subdomain, root shows the user's profile */}
          <Route path="/" element={<Profile pubkey={pubkey} isSubdomain subdomain={subdomain} />} />
          {/* Allow navigating to other pages from subdomain */}
          <Route path="/browse" element={<Browse />} />
          <Route path="/search" element={<Search />} />
          <Route path="/video/:id" element={<Video />} />
          <Route path="/embed/:id" element={<Embed />} />
          <Route path="/settings/profile" element={<Settings />} />
          <Route path="/settings/myspace" element={<MySpaceSettings />} />
          <Route path="*" element={<Profile pubkey={pubkey} isSubdomain subdomain={subdomain} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // If we're on an unclaimed subdomain, show the claim page
  if (isSubdomain && isUnclaimed && subdomain) {
    return (
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="*" element={<ClaimName subdomain={subdomain} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Normal routing for apex domain
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/search" element={<Search />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/video/:id" element={<Video />} />
        <Route path="/embed/:id" element={<Embed />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/settings/profile" element={<Settings />} />
        <Route path="/settings/myspace" element={<MySpaceSettings />} />
        <Route path="/callback" element={<Callback />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export function AppRouter() {
  return <SubdomainAwareRouter />;
}

export default AppRouter;
