export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-sage-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-secondary-500 font-sans">Loading...</p>
      </div>
    </div>
  );
}
