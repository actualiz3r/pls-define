"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface Explanation {
  term: string
  definition: string
  color: string
}

export function Explainer() {
  const [inputText, setInputText] = useState("")
  const [explanations, setExplanations] = useState<Explanation[]>([])
  const [highlightedText, setHighlightedText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isExplained, setIsExplained] = useState(false)
  const [error, setError] = useState<string | null>(null);

  const colors = [
    "bg-blue-200", "bg-green-200", "bg-yellow-200", "bg-pink-200", "bg-purple-200",
    "bg-indigo-200", "bg-red-200", "bg-orange-200", "bg-teal-200", "bg-cyan-200",
    "bg-lime-200", "bg-emerald-200", "bg-fuchsia-200", "bg-violet-200", "bg-rose-200",
    "bg-sky-200", "bg-amber-200", "bg-slate-200", "bg-neutral-200", "bg-stone-200",
    "bg-blue-300", "bg-green-300", "bg-yellow-300", "bg-pink-300", "bg-purple-300",
    "bg-indigo-300", "bg-red-300", "bg-orange-300", "bg-teal-300", "bg-cyan-300",
    "bg-lime-300", "bg-emerald-300", "bg-fuchsia-300", "bg-violet-300", "bg-rose-300",
    "bg-sky-300", "bg-amber-300", "bg-slate-300", "bg-neutral-300", "bg-stone-300",
    "bg-blue-100", "bg-green-100", "bg-yellow-100", "bg-pink-100", "bg-purple-100",
    "bg-indigo-100", "bg-red-100", "bg-orange-100", "bg-teal-100", "bg-cyan-100"
  ];

  const handleExplain = async () => {
    setIsLoading(true)
    setExplanations([])
    setHighlightedText("")
    setError(null)
    try {
      console.log("Sending API request with text:", inputText)
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText, isUserAction: true }),
      });
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a few seconds.");
        }
        throw new Error(`API request failed with status ${response.status}`);
      }
      const result = await response.json()
      console.log("Received API response:", result)
      const explanationsWithColor = result.map((item, index) => ({
        ...item,
        color: colors[index % colors.length]
      }))
      setExplanations(explanationsWithColor)
      setHighlightedText(highlightTerms(inputText, explanationsWithColor))
      setIsExplained(true)
    } catch (error) {
      console.error("Error calling API:", error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartOver = () => {
    setInputText("")
    setExplanations([])
    setHighlightedText("")
    setIsExplained(false)
  }

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="p-4 bg-gray-100 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">pls-define</h1>
        <a href="https://twitter.com/ng_actualizer" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
          X
        </a>
      </div>
      <div className="flex flex-1 overflow-hidden p-8 gap-8">
        <div className="w-1/2 flex flex-col">
          {isExplained ? (
            <>
              <div 
                className="flex-grow border-2 border-gray-300 rounded-md p-4 text-lg mb-4 overflow-auto custom-scrollbar" 
                dangerouslySetInnerHTML={{ __html: highlightedText }} 
              />
              <Button className="w-full" onClick={handleStartOver}>
                Start Over
              </Button>
            </>
          ) : (
            <>
              <Textarea
                placeholder="Enter text from which to extract definitions..."
                className="w-full flex-grow resize-none border-2 border-gray-300 rounded-md p-4 text-lg mb-2 custom-scrollbar focus-visible:outline-none focus-visible:ring-0 focus-visible:border-gray-300"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <Button className="w-full" onClick={handleExplain} disabled={isLoading}>
                {isLoading ? "Analyzing..." : "Extract Definitions"}
              </Button>
              {error && (
                <div className="text-red-500 text-center mt-2">{error}</div>
              )}
            </>
          )}
        </div>
        <div className="w-1/2 flex flex-col bg-background border-2 border-gray-300 rounded-md overflow-hidden">
          <div className="flex-grow overflow-auto custom-scrollbar p-4">
            {isLoading ? (
              <div className="text-center">Loading definitions...</div>
            ) : (
              <div className="space-y-4">
                {explanations.map((explanation, index) => (
                  <div key={index} className="grid grid-cols-[minmax(0,30%)_1fr] items-start gap-4">
                    <div className={`${explanation.color} rounded-md px-2 py-1 font-medium break-words text-center flex items-center justify-center min-h-[2.5rem]`}>
                      {explanation.term}
                    </div>
                    <div>
                      <p>{explanation.definition}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Add this function at the end of the file
function highlightTerms(text: string, explanations: Explanation[]): string {
  let highlightedText = text;
  explanations.forEach((explanation) => {
    const regex = new RegExp(`\\b${explanation.term}\\b`, 'gi');
    highlightedText = highlightedText.replace(regex, `<span class="${explanation.color} px-1 rounded-sm">$&</span>`);
  });
  return highlightedText;
}
