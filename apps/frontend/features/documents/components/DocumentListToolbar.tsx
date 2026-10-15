'use client'

import { endOfDay, format, isSameDay, startOfDay } from 'date-fns'
import { CalendarIcon, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { type DocumentListParamUpdates } from '@/features/documents/hooks/useDocumentListParams'
import { type ListDocumentsQuery } from '@/features/documents/schemas'

const SEARCH_DEBOUNCE_MS = 300

type Props = {
  query: ListDocumentsQuery
  setParams: (updates: DocumentListParamUpdates, options?: { replace?: boolean }) => void
}

export function DocumentListToolbar({ query, setParams }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchInput query={query} setParams={setParams} />
      <DateRangeFilter query={query} setParams={setParams} />
    </div>
  )
}

function SearchInput({ query, setParams }: Props) {
  const urlSearch = query.search ?? ''
  const [search, setSearch] = useState(urlSearch)

  // URL changed from outside (back button, "clear filters"), so show its value
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch)
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch)
    if (search.trim() !== urlSearch) setSearch(urlSearch)
  }

  useEffect(() => {
    const value = search.trim()
    if (value === urlSearch) return
    const id = setTimeout(() => setParams({ search: value, page: undefined }, { replace: true }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [search, urlSearch, setParams])

  return (
    <InputGroup className="sm:max-w-xs">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        placeholder="Search documents..."
        aria-label="Search documents"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setSearch('')}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

function DateRangeFilter({ query, setParams }: Props) {
  const { createdFrom, createdTo } = query
  const selected: DateRange | undefined = createdFrom || createdTo ? { from: createdFrom, to: createdTo } : undefined

  function handleSelect(range: DateRange | undefined) {
    setParams({
      createdFrom: range?.from && startOfDay(range.from).toISOString(),
      createdTo: range?.to && endOfDay(range.to).toISOString(),
      page: undefined,
    })
  }

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger render={<Button variant="outline" className="justify-start font-normal" />}>
          <CalendarIcon data-icon="inline-start" />
          <span className={selected ? undefined : 'text-muted-foreground'}>{formatRange(createdFrom, createdTo)}</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={createdFrom}
            numberOfMonths={2}
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>
      {selected && (
        <Button variant="ghost" size="icon" aria-label="Clear date filter" onClick={() => handleSelect(undefined)}>
          <X />
        </Button>
      )}
    </div>
  )
}

function formatRange(from?: Date, to?: Date) {
  const fmt = (date: Date) => format(date, 'MMM d, y')
  if (from && to) return isSameDay(from, to) ? fmt(from) : `${fmt(from)} - ${fmt(to)}`
  if (from) return `From ${fmt(from)}`
  if (to) return `Until ${fmt(to)}`
  return 'Uploaded date'
}
