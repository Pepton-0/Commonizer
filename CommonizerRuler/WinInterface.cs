using System.Windows;
using System.Runtime.InteropServices;
using System.Drawing;

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

        [DllImport("user32")]
        public static extern int SetCursorPos(int x, int y);

        /// <summary>
        /// Retrieves the cursor's position, in screen coordinates.
        /// </summary>
        /// <see>See MSDN documentation for further information.</see>
        [DllImport("user32")]
        static extern bool GetCursorPos(out POINT lpPoint);

        /// <summary>
        /// Get display settings
        /// </summary>
        /// <param name="deviceName"></param>
        /// <param name="modeNum"></param>
        /// <param name="devMode"></param>
        /// <returns></returns>
        [DllImport("user32.dll")]
        static extern bool EnumDisplaySettings(string deviceName, int modeNum, ref DEVMODE devMode);

        public static Point GetCursorPos(out bool succeed)
        {
            POINT lpPoint;
            succeed = GetCursorPos(out lpPoint);

            if (succeed)
                return lpPoint;
            else
                return new Point(int.MaxValue, int.MaxValue); // return a invalid number which represents infinity.
        }

        /// <summary>
        /// マルチモニタにも対応したいなぁ
        /// </summary>
        /// <returns></returns>
        public static Point GetWindowSize(out bool suceed)
        {
            int enum_current_settings = -1;
            DEVMODE devmode = default;
            devmode.dmSize = (short)Marshal.SizeOf(devmode);
            suceed = EnumDisplaySettings(null, enum_current_settings, ref devmode);

            if (suceed)
                return new Point(devmode.dmPelsWidth, devmode.dmPelsHeight);
            else
                return new Point(int.MaxValue, int.MinValue); // return a invalid number which represents infinity
        }
    }
}
