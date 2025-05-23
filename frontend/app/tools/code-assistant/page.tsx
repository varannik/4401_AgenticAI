export default function CodeAssistantPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Code Assistant</h1>
      <div className="backdrop-blur-lg rounded-lg p-6 shadow-lg border border-white/20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <select className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>JavaScript</option>
                <option>Python</option>
                <option>TypeScript</option>
                <option>Java</option>
              </select>
              <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Analyze
              </button>
            </div>
            <textarea
              placeholder="Paste your code here..."
              className="w-full h-[400px] rounded-lg border border-gray-300 p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Suggestions</h2>
            <div className="bg-white/50 rounded-lg p-4 space-y-4">
              <div className="p-4 bg-blue-50/50 rounded-lg">
                <h3 className="font-medium text-blue-900">Code Analysis</h3>
                <p className="text-blue-700 mt-2">Your code will be analyzed here...</p>
              </div>
              <div className="p-4 bg-green-50/50 rounded-lg">
                <h3 className="font-medium text-green-900">Improvements</h3>
                <p className="text-green-700 mt-2">Suggested improvements will appear here...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 