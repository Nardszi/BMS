import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, beforeEach } from "vitest"
import { useRecentSearches } from "@/hooks/use-recent-searches"

describe("useRecentSearches", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("returns empty array initially", () => {
    const { result } = renderHook(() => useRecentSearches())
    expect(result.current.recentSearches).toEqual([])
  })

  it("adds a search term", () => {
    const { result } = renderHook(() => useRecentSearches())
    act(() => {
      result.current.addSearch("Juan Cruz")
    })
    expect(result.current.recentSearches).toEqual(["Juan Cruz"])
  })

  it("removes duplicates when adding", () => {
    const { result } = renderHook(() => useRecentSearches())
    act(() => {
      result.current.addSearch("Juan")
      result.current.addSearch("Cruz")
      result.current.addSearch("Juan")
    })
    expect(result.current.recentSearches).toEqual(["Juan", "Cruz"])
  })

  it("limits to 5 recent searches", () => {
    const { result } = renderHook(() => useRecentSearches())
    act(() => {
      for (let i = 1; i <= 7; i++) {
        result.current.addSearch(`Search ${i}`)
      }
    })
    expect(result.current.recentSearches).toHaveLength(5)
    expect(result.current.recentSearches[0]).toBe("Search 7")
  })

  it("removes a search term", () => {
    const { result } = renderHook(() => useRecentSearches())
    act(() => {
      result.current.addSearch("Juan")
      result.current.addSearch("Cruz")
      result.current.removeSearch("Juan")
    })
    expect(result.current.recentSearches).toEqual(["Cruz"])
  })

  it("clears all searches", () => {
    const { result } = renderHook(() => useRecentSearches())
    act(() => {
      result.current.addSearch("Juan")
      result.current.addSearch("Cruz")
      result.current.clearSearches()
    })
    expect(result.current.recentSearches).toEqual([])
  })
})
