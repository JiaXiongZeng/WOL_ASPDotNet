using WOL_ASPDotNet.Utilities.Implement;

namespace WOL_ASPDotNet.Utilities.Interface
{
    public interface INamedTimerPool: IDisposable
    {
        NamedTimer Register(string id, TimerCallback callback, object state = null, TimeSpan? dueTime = null, TimeSpan? period = null);

        NamedTimer Get(string id);

        NamedTimer Remove(string id);
    }
}
