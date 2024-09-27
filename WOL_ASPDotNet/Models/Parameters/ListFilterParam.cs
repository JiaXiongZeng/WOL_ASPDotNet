using Microsoft.AspNetCore.Mvc;
using WOL_ASPDotNet.Utilities.Implement;

namespace WOL_ASPDotNet.Models.Parameters
{
    public class ListFilterParam
    {
        public int? start { get; set; } = 0;

        public int? size { get; set; } = 10;

        [BindProperty(BinderType = typeof(JsonDeserializableModelBinder))]
        public IEnumerable<FilterParam> filters { get; set; }

        public string globalFilter { get; set; }

        [BindProperty(BinderType = typeof(JsonDeserializableModelBinder))]
        public IEnumerable<SortingParam> sorting { get; set; }
    }
}
