import HomePage from "@/components/HomePage";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div>
      <HomePage />
      <div className="text-center py-8">
        <Button onClick={() => window.location.href = '/auth'} size="lg" className="shadow-elegant">
          Get Started - Sign Up Now
        </Button>
      </div>
    </div>
  );
};

export default Index;
