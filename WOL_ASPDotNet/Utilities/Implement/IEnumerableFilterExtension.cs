using WOL_ASPDotNet.Models.Parameters;
using WOL_ASPDotNet.Models.ViewModels;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public static class IEnumerableFilterExtension
    {
        /// <summary>
        /// 將資料過濾器應用在清單中
        /// </summary>
        /// <typeparam name="T">清單元素的型別</typeparam>
        /// <param name="list">清單</param>
        /// <param name="param">資料過濾器</param>
        /// <returns></returns>
        public static PageViewModel<T> applyFilter<T>(this IEnumerable<T> list, ListFilterParam param)
        {
            var filteredList = list;

            //Filtered by global search keyword
            var propNames = typeof(T).GetPropertyNames();
            var allglobalFilterMatched = Enumerable.Empty<T>();
            foreach (var propName in propNames)
            {
                allglobalFilterMatched = allglobalFilterMatched.Concat(filteredList.Where(x => new PropertyIndexerWrapper(x)[propName].Like(param.globalFilter)));
            }

            filteredList = allglobalFilterMatched.Distinct();


            //Filtered by columns
            foreach (var filter in param.filters)
            {
                filteredList = filteredList.Where(x => new PropertyIndexerWrapper(x)[filter.id].Like(filter.value));
            }

            //Sort by columns
            var sortConditions = param.sorting;
            int sortIdx = 0;
            IOrderedEnumerable<T> currentSort = null;
            foreach (var sort in sortConditions)
            {
                if (sortIdx == 0)
                {
                    currentSort = filteredList.OrderByFlag(sort.desc, x => new PropertyIndexerWrapper(x)[sort.id].ToString());
                }
                else
                {
                    currentSort = currentSort.ThenByFlag(sort.desc, x => new PropertyIndexerWrapper(x)[sort.id].ToString());
                }

                sortIdx++;
            }

            if (currentSort != null)
            {
                filteredList = currentSort;
            }


            //Memorize the total count of the list before taking elements
            var result = new PageViewModel<T>
            {
                meta =
                {
                    totalRowCount = filteredList.Count()
                }
            };

            //Fetch from start index and take specified size
            filteredList = filteredList.Skip(param.start.Value).Take(param.size.Value);


            //Assing the post-processing data to result model
            result.data = filteredList;

            return result;
        }
    }
}
