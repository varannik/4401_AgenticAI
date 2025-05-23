export default function ImageGeneratorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Image Generator</h1>
      <div className="backdrop-blur-lg rounded-lg p-6 shadow-lg border border-white/20">
        <div className="space-y-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Describe the image you want to generate..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              Generate
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="aspect-square bg-gray-100/50 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Generated image will appear here</span>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Image Size</label>
                <select className="w-full rounded-lg border border-gray-300 px-4 py-2">
                  <option>512x512</option>
                  <option>1024x1024</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 