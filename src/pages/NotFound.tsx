import { useSeoMeta } from "@unhead/react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Search, Video } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useSeoMeta({
    title: "404 - Page Not Found | DiVine Space",
    description: "The page you are looking for could not be found. Return to the home page to continue browsing.",
  });

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center myspace-card">
          <CardContent className="py-12">
            <div className="text-8xl font-bold gradient-text mb-4">404</div>
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <Button className="gap-2 w-full sm:w-auto">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </Link>
              <Link to="/browse">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <Video className="h-4 w-4" />
                  Browse Videos
                </Button>
              </Link>
              <Link to="/search">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NotFound;
