import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BlogHeader = () => {
  return (
    <header className="border-b bg-gradient-to-b from-brand-icy-blue to-brand-glacier mt-20 py-16">
      <div className="max-w-[1300px] mx-auto px-4 text-center md:px-8">
        <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">
          Inside Design: Stories and interviews
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Subscribe to learn about new product features, the latest in technology, solutions, and updates.
        </p>
        
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Input
            type="email"
            placeholder="Enter your email"
            className="h-11 border-brand-mist"
          />
          <Button className="h-11 px-6">
            Subscribe
          </Button>
        </div>
      </div>
    </header>
  );
};

export default BlogHeader;
