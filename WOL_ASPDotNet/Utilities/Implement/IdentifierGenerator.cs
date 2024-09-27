using WOL_ASPDotNet.Utilities.Interface;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public class IdentifierGenerator: IIdentifierGenerator
    {
        private ushort _counter;
        private HashSet<ushort> _usedIdentifiers;
        private const ushort MaxValue = 65535;
        private static readonly Random _random = new Random();

        private object locker = new();

        public IdentifierGenerator()
        {
            _counter = 0;
            _usedIdentifiers = new HashSet<ushort>();
        }

        public ushort Generate()
        {
            lock (locker)
            {
                //Try to get a usable identity
                while (true)
                {
                    // Generate identifier combining counter and random value
                    ushort identifier = (ushort)((_counter + _random.Next(0, 16)) % (MaxValue + 1));
                    _counter = (ushort)((_counter + 1) % (MaxValue + 1));

                    if (!_usedIdentifiers.Contains(identifier))
                    {
                        _usedIdentifiers.Add(identifier);
                        return identifier;
                    }
                }
            }
        }

        public void RemoveOldIdentifier(ushort id)
        {
            lock (locker)
            {
                this._usedIdentifiers.Remove(id);
            }
        }

        public void RemoveAll()
        {
            lock (locker)
            {
                this._usedIdentifiers.Clear();
            }
        }
    }
}
