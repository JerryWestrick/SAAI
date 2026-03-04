/**
 * Naive singularization: handles common English plural suffixes.
 * "Products" → "Product", "Categories" → "Category", "Addresses" → "Address"
 */
function singularize(name) {
  if (name.endsWith('ies') && name.length > 3) {
    return name.slice(0, -3) + 'y'
  }
  if (name.endsWith('ses') || name.endsWith('xes') || name.endsWith('zes') || name.endsWith('hes')) {
    return name.slice(0, -2)
  }
  if (name.endsWith('s') && !name.endsWith('ss')) {
    return name.slice(0, -1)
  }
  return name
}

/**
 * Find a data dictionary entry by name with fuzzy matching.
 *
 * Priority:
 * 1. Exact match
 * 2. Singularized match (plural store name → singular DD entry)
 * 3. Prefix/contains match
 *
 * All matches are scoped to the given projectId.
 */
export function findDDEntry(name, dataDictionary, projectId) {
  if (!name || !dataDictionary) return null

  const candidates = projectId != null
    ? dataDictionary.filter(dd => dd.project_id === projectId)
    : dataDictionary

  // 1. Exact match
  const exact = candidates.find(dd => dd.name === name)
  if (exact) return exact

  // 2. Singular match
  const singular = singularize(name)
  if (singular !== name) {
    const match = candidates.find(dd => dd.name === singular)
    if (match) return match
  }

  // 3. Prefix / contains match
  const nameLower = name.toLowerCase()
  const prefix = candidates.find(dd => {
    const ddLower = dd.name.toLowerCase()
    return ddLower.startsWith(nameLower) || nameLower.startsWith(ddLower)
  })
  if (prefix) return prefix

  return null
}
