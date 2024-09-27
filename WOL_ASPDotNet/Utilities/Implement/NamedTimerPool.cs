using System.Diagnostics;
using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public class NamedTimerPool : INamedTimerPool
    {
        private object locker = new object();

        private int _maximumCout = 50;

        private List<NamedTimer> _timers = new List<NamedTimer>();

        private bool _isDisposed = false;


        public NamedTimerPool(int? maximumCount = null)
        {
            if (maximumCount.HasValue)
            {
                if (maximumCount.Value <= 0)
                {
                    throw new ArgumentException("The size of pool must be greater then 0");
                }

                _maximumCout = maximumCount.Value;
            }
        }


        public NamedTimer Register(string id, TimerCallback callback, object state = null, TimeSpan? dueTime = null, TimeSpan? period = null)
        {
            NamedTimer result = null;

            lock (locker)
            {
                if (_timers.Count + 1 > _maximumCout)
                {
                    return null;
                }
                
                if (string.IsNullOrEmpty(id))
                {
                    id = Guid.NewGuid().ToString();
                }

                if (this.Get(id) != null)
                {
                    throw new ArgumentException($"The ID of timer '{id}' is exist");
                }

                result = new NamedTimer(id, callback, state, dueTime, period);
                _timers.Add(result);
            }
            
            return result;
        }

        public NamedTimer Get(string id)
        {
            NamedTimer result = null;

            lock (locker)
            {
                result = _timers.FirstOrDefault(x => x.ID == id);
            }

            return result;
        }

        public NamedTimer Remove(string id)
        {
            NamedTimer result = null;

            lock (locker)
            {
                result = _timers.FirstOrDefault(x => x.ID == id);
                _timers.Remove(result);
            }

            return result;
        }

        public void Dispose()
        {
            lock (locker)
            {
                if (!this._isDisposed)
                {
                    foreach (var timer in this._timers)
                    {
                        timer.Dispose();
                    }
                    this._timers.Clear();
                    this._timers = null;
                    this._isDisposed = true;
                }
            }
        }
    }

    public class NamedTimer: IDisposable
    {
        private string _id;

        private Timer _timer = null;

        private TimerCallback _oriCallback = null;

        private TimerCallback _custCallback = null;

        private long _dueTime = 0;

        private long _period = Timeout.Infinite;

        private object _state = null;

        private bool _isStart;

        private bool _isExecuting;

        private bool _isDisposed = false;



        public string ID { get { return _id; } }

        public bool IsStart { get { return _isStart; } }

        public bool IsExecuting { get { return _isExecuting; } }

        public long DueTime { 
            get 
            {
                return this._dueTime;
            }

            internal set 
            {
                this._dueTime = value;
                resetTimer();
            }
        }

        public long Period { 
            get 
            {
                return this._period;
            }

            internal set 
            {
                this._period = value;
                resetTimer();
            }
        }       


        public NamedTimer(string id, TimerCallback callback, object state, long dueTime, long period)
        {
            initTimer(id, callback, state, dueTime, period);
        }

        public NamedTimer(string id, TimerCallback callback, object state = null, TimeSpan? dueTime = null, TimeSpan? period = null)
        {
            long calcDueTime = dueTime.HasValue ? (long)dueTime.Value.TotalMilliseconds : 0;
            long calcPeriod = period.HasValue ? (long)period.Value.TotalMilliseconds : Timeout.Infinite;
            initTimer(id, callback, state, calcDueTime, calcPeriod);
        }

        private void initTimer(string id, TimerCallback callback, object state, long dueTime, long period)
        {
            if (string.IsNullOrEmpty(id))
            {
                throw new ArgumentException("ID must not be null or empty.");
            }

            if (callback == null)
            {
                throw new ArgumentException("Must specify callback for timer executing.");
            }

            this._id = id;
            this._oriCallback = callback;
            this._custCallback = delegate (object obj)
            {
                this._isExecuting = true;
                this._oriCallback(obj);
                this._isExecuting = false;
            };
            this._state = state;
            this._dueTime = dueTime;
            this._period = period;
            this._isStart = false;
        }

        public void Start()
        {
            if (this._timer != null && this.IsStart)
            {
                throw new InvalidOperationException("Timer has been started.");
            }
            this._timer = new Timer(this._custCallback, this._state, this._dueTime, this._period);
            this._isStart = true;
        }

        private void resetTimer()
        {
            if (this._timer != null)
            {
                this._timer.Change(this._dueTime, this._period);
            }
        }

        public void StartImmediately()
        {
            this.DueTime = 0;
        }

        public void Stop()
        {
            if (this._timer != null)
            {
                this._timer.Dispose();
            }
            this._timer = null;
            this._isStart = false;
            this._isExecuting = false;
        }

        public void Dispose()
        {
            if (!this._isDisposed)
            {
                this.Stop();
                this._isDisposed = true;
            }
        }
    }
}
