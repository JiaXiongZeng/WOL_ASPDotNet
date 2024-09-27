namespace WOL_ASPDotNet.Utilities.Implement
{
    public static class LinqOrderByExtension
    {
        public static IOrderedEnumerable<TSource> OrderByFlag<TSource, TKey>(this IEnumerable<TSource> source, bool IsDescending, Func<TSource, TKey> keySelector) {
            if (IsDescending)
            {
                return source.OrderByDescending(keySelector);
            }
            return source.OrderBy(keySelector);
        }

        public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(this IEnumerable<TSource> source, bool IsDescending, Func<TSource, TKey> keySelector, IComparer<TKey> comparer)
        {
            if (IsDescending)
            {
                return source.OrderByDescending(keySelector, comparer);
            }
            return source.OrderBy(keySelector, comparer);
        }

        public static IOrderedEnumerable<TSource> ThenByFlag<TSource, TKey>(this IOrderedEnumerable<TSource> source, bool IsDescending, Func<TSource, TKey> keySelector)
        {
            if (IsDescending)
            {
                return source.ThenByDescending(keySelector);
            }
            return source.ThenBy(keySelector);
        }

        public static IOrderedEnumerable<TSource> ThenByFlag<TSource, TKey>(this IOrderedEnumerable<TSource> source, bool IsDescending, Func<TSource, TKey> keySelector, IComparer<TKey> comparer)
        {
            if (IsDescending)
            {
                return source.ThenByDescending(keySelector, comparer);
            }
            return source.ThenBy(keySelector, comparer);
        }
    }
}
