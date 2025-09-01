import HomePage from "@/components/HomePage";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div>
      <HomePage />
      <div className="text-center py-8 space-y-4">
        <Button onClick={() => window.location.href = '/ads'} size="lg" className="shadow-elegant mr-4">
          Browse Ads
        </Button>
        <Button onClick={() => window.location.href = '/auth'} size="lg" variant="outline" className="shadow-elegant">
          Get Started - Sign Up Now
        </Button>
      </div>
    </div>
  );
};

export default Index;
