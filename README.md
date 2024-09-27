# WOL_ASPDotNet

This project is a network utility for managing hosts on intranet via web UI (such like Ping, WOL, RDP, ARP...etc.)

## The idea is innovated by [YokinsWOL](https://github.com/JakeJP/YokinsWOL)

## Powered by

### Backend
1. ASP.NET Core v.8
2. Sharppcap
3. PacketDotNet
4. Dapper
5. SQLite
6. Vite.AspNetCore
7. Vite

### Frontend
1. React
2. React-Hook-Form
3. MUI
4. Axios
5. DayJs

## Notice

You have to install Pcap utility to run the app smoothly.
(For cross platform goal, it uses libpcap as dependency)

## Future works

### Short Term

- Integrate with mstsc.js (node.js node-rdpjs as remote desktop service)

### Long Term

- Integrate with Apache Guacamole
- Migrate to Rasperpi Zero as bootup server
- Config the log in credential for every host entry in the list
- Support IPv6