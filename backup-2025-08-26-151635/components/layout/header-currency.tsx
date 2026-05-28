"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function HeaderCurrency() {
  const [selectedCurrency, setSelectedCurrency] = useState("fcfa")

  return (
    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
      <SelectTrigger className="w-24 bg-gray-600 border-gray-500 text-white rounded-full px-3 py-2">
        <SelectValue />
        <ChevronDown className="h-4 w-4 ml-1" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="fcfa">F CFA</SelectItem>
        <SelectItem value="eur">EUR</SelectItem>
        <SelectItem value="usd">USD</SelectItem>
      </SelectContent>
    </Select>
  )
}


