namespace WOL_ASPDotNet.Models.ViewModels
{
    public class PageViewModel<T>
    {
        public IEnumerable<T> data { get; set; } = Enumerable.Empty<T>();

        public MetaType meta { get; set; } = new();
    }

    public class MetaType
    {
        public int totalRowCount { get; set; }
    }
}
