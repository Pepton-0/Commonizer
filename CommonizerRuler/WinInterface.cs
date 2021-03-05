using System.Runtime.InteropServices;
using System.Drawing;
/*
using System;
using System.ComponentModel;
using System.Management;
using System.Diagnostics;
*/

namespace CommonizerRuler
{
    class WinInterface
    {
        /// <summary>
        /// Struct representing a point.
        /// </summary>
        [StructLayout(LayoutKind.Sequential)]
        public struct POINT
        {
            public int X;
            public int Y;

            public static implicit operator Point(POINT point)
            {
                return new Point(point.X, point.Y);
            }
        }


        [StructLayout(LayoutKind.Sequential)]
        struct DEVMODE
        {
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 0x20)]
            public string dmDeviceName;
            public short dmSpecVersion;
            public short dmDriverVersion;
            public short dmSize;
            public short dmDriverExtra;
            public int dmFields;
            public int dmPositionX;
            public int dmPositionY;
            public int dmDisplayOrientation;
            public int dmDisplayFixedOutput;
            public short dmColor;
            public short dmDuplex;
            public short dmYResolution;
            public short dmTTOption;
            public short dmCollate;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 0x20)]
            public string dmFormName;
            public short dmLogPixels;
            public int dmBitsPerPel;
            public int dmPelsWidth;
            public int dmPelsHeight;
            public int dmDisplayFlags;
            public int dmDisplayFrequency;
            public int dmICMMethod;
            public int dmICMIntent;
            public int dmMediaType;
            public int dmDitherType;
            public int dmReserved1;
            public int dmReserved2;
            public int dmPanningWidth;
            public int dmPanningHeight;
        }

        /// <summary>
        /// Identifies dots per inch (dpi) type.
        /// </summary>
        public enum MonitorDpiType
        {
            /// <summary>
            /// MDT_Effective_DPI
            /// <para>Effective DPI that incorporates accessibility overrides and matches what Desktop Window Manage (DWM) uses to scale desktop applications.</para>
            /// </summary>
            EffectiveDpi = 0,

            /// <summary>
            /// MDT_Angular_DPI
            /// <para>DPI that ensures rendering at a compliant angular resolution on the screen, without incorporating accessibility overrides.</para>
            /// </summary>
            AngularDpi = 1,

            /// <summary>
            /// MDT_Raw_DPI
            /// <para>Linear DPI of the screen as measures on the screen itself.</para>
            /// </summary>
            RawDpi = 2,

            /// <summary>
            /// MDT_Default
            /// </summary>
            Default = EffectiveDpi,
        }

        /// <summary>
        /// Determines the function's return value if the window does not intersect any display monitor.
        /// This parameter can be one of the following values.
        /// </summary>
        public enum MonitorDefaultTo
        {
            /// <summary>
            /// Returns a handle to the display monitor that is nearest to the window.
            /// </summary>
            MONITOR_DEFAULTTONEAREST,

            /// <summary>
            /// Returns NULL.
            /// </summary>
            MONITOR_DEFAULTTONULL,

            /// <summary>
            /// Returns a handle to the primary display monitor.
            /// </summary>
            MONITOR_DEFAULTTOPRIMARY
        }

        private const int S_OK = 0;
        private enum PROCESS_DPI_AWARENESS
        {
            PROCESS_DPI_UNAWARE = 0,
            PROCESS_SYSTEM_DPI_AWARE = 1,
            PROCESS_PER_MONITOR_DPI_AWARE = 2
        }

        private const int PROCESS_QUERY_INFORMATION = 0x0400;
        private const int PROCESS_VM_READ = 0x0010;

        [DllImport("user32")]
        public static extern int SetCursorPos(int x, int y);

        /// <summary>
        /// Retrieves the cursor's position, in screen coordinates.
        /// </summary>
        /// <see>See MSDN documentation for further information.</see>
        [DllImport("user32")]
        private static extern bool GetCursorPos(out POINT lpPoint);

        /// <summary>
        /// Get display settings
        /// </summary>
        /// <param name="deviceName"></param>
        /// <param name="modeNum"></param>
        /// <param name="devMode"></param>
        /// <returns></returns>
        [DllImport("user32.dll")]
        private static extern bool EnumDisplaySettings(string deviceName, int modeNum, ref DEVMODE devMode);

        /*
        [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern IntPtr MonitorFromWindow(IntPtr hwnd, MonitorDefaultTo dwFlags);

        [DllImport("Kernel32.dll", SetLastError = true)]
        private static extern IntPtr OpenProcess(uint dwDesiredAccess, [MarshalAs(UnmanagedType.Bool)] bool bInheritHandle, uint dwProcessId);

        [DllImport("Kernel32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool CloseHandle(IntPtr handle);

        [DllImport("Shcore.dll")]
        private static extern int GetProcessDpiAwareness(IntPtr hprocess, out PROCESS_DPI_AWARENESS value);

        [DllImport("SHCore.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
        public static extern void GetDpiForMonitor(IntPtr hmonitor, MonitorDpiType dpiType, ref uint dpiX, ref uint dpiY);

        private static uint GetParentProcessId()
        {
            var myProcId = Process.GetCurrentProcess().Id;
            var query = string.Format("SELECT ParentProcessId FROM Win32_Process WHERE ProcessId = {0}", myProcId);

            using (var search = new ManagementObjectSearcher(@"root\CIMV2", query))
            //クエリから結果を取得
            using (var results = search.Get().GetEnumerator())
            {

                if (!results.MoveNext()) throw new ApplicationException("Couldn't Get ParrentProcessId.");

                var queryResult = results.Current;
                //親プロセスのPIDを取得
                return (uint)queryResult["ParentProcessId"];
            }
        }*/

        /// <summary>
        /// マルチモニタにも対応したいなぁ
        /// </summary>
        /// <returns></returns>
        public static Point GetInternalWindowSize(out int state)
        {
            int enum_current_settings = -1;
            DEVMODE devmode = default;
            devmode.dmSize = (short)Marshal.SizeOf(devmode);
            bool suceed = EnumDisplaySettings(null, enum_current_settings, ref devmode);

            /*
            if (suceed)
            {*/
                // TODO 強制的にここになるように指定
                if (true)
                {
                    state = 3;
                    return new Point(devmode.dmPelsWidth, devmode.dmPelsHeight);
                }

                /*
                PROCESS_DPI_AWARENESS awareness; // DPI設定で、何かしらの処理方法が存在するかどうか
                GetProcessDpiAwareness(new IntPtr(Process.GetCurrentProcess().Id), out awareness);
                if(awareness == PROCESS_DPI_AWARENESS.PROCESS_DPI_UNAWARE)
                {
                    state = 1;
                    return new Point(devmode.dmPelsWidth, devmode.dmPelsHeight);
                }
                else
                {
                    IntPtr browserHwnd = Process.GetProcessById((int)GetParentProcessId()).MainWindowHandle;
                        //Process.GetProcessById(46424).MainWindowHandle;
                    IntPtr hmonitor = MonitorFromWindow(browserHwnd, MonitorDefaultTo.MONITOR_DEFAULTTONEAREST);
                    uint dpiX = 1, dpiY = 1;
                    GetDpiForMonitor(hmonitor, MonitorDpiType.EffectiveDpi, ref dpiX, ref dpiY);
                    Console.WriteLine("DPI:" + dpiX + "," + dpiY);
                    int actualWidth = (int)((float)devmode.dmPelsWidth / ((float)dpiX / 96f));
                    int actualHeight = (int)((float)devmode.dmPelsHeight / ((float)dpiY / 96f));
                    state = 2;
                    return new Point(actualWidth, actualHeight);
                }
            }
            else
            {
                state = 0;
                return new Point(int.MaxValue, int.MinValue); // return a invalid number which represents infinity
            }*/
        }

        public static Point GetCursorPos(out bool succeed)
        {
            POINT lpPoint;
            succeed = GetCursorPos(out lpPoint);

            if (succeed)
                return lpPoint;
            else
                return new Point(int.MaxValue, int.MaxValue); // return a invalid number which represents infinity.
        }

        /*
        public static string GetDpi()
        {
            // TODO Chrome拡張機能の時、この行はエラーを引き起こす.
            return Process.GetProcessById((int)GetParentProcessId()).ToString();
        }
        */
    }
}
