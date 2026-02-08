import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-10 w-48 bg-primary-400 rounded-lg animate-pulse" />
        <div className="h-6 w-64 bg-primary-400 rounded animate-pulse" />
      </div>

      <Card className="bg-primary-300 border-primary-500 rounded-2xl shadow-md p-12">
        <div className="space-y-4">
          <div className="h-8 w-32 bg-primary-400 rounded-lg animate-pulse mx-auto" />
          <div className="h-4 w-64 bg-primary-400 rounded animate-pulse mx-auto" />
          <div className="h-10 w-40 bg-primary-400 rounded-xl animate-pulse mx-auto" />
        </div>
      </Card>
    </div>
  );
}
