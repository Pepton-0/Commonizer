using System.Runtime.InteropServices;
using System.Drawing;
using System;
/*
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

        [StructLayout(LayoutKind.Sequential)]
        public struct MOUSEINPUT
        {
            public int dx;
            public int dy;
            public int mouseData;
            public int dwFlags;
            public int time;
            public IntPtr dwExtraInfo;
        };

        [StructLayout(LayoutKind.Sequential)]
        public struct KEYBDINPUT
        {
            public short wVk;
            public short wScan;
            public int dwFlags;
            public int time;
            public IntPtr dwExtraInfo;
        };

        [StructLayout(LayoutKind.Sequential)]
        public struct HARDWAREINPUT
        {
            public int uMsg;
            public short wParamL;
            public short wParamH;
        };

        [StructLayout(LayoutKind.Explicit)]
        public struct INPUT_UNION
        {
            [FieldOffset(0)] public MOUSEINPUT mouse;
            [FieldOffset(0)] public KEYBDINPUT keyboard;
            [FieldOffset(0)] public HARDWAREINPUT hardware;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct INPUT
        {
            public int type;
            public INPUT_UNION ui;
        };

        // values for SendInput
        const int INPUT_MOUSE = 0;
        const int INPUT_KEYBOARD = 1;
        const int INPUT_HARDWARE = 2;
        const int MOUSEEVENTF_MOVE = 0x0001;
        const int MOUSEEVENTF_ABSOLUTE = 0x8000;
        const int MOUSEEVENTF_LEFTDOWN = 0x0002;
        const int MOUSEEVENTF_LEFTUP = 0x0004;
        const int MOUSEEVENTF_RIGHTDOWN = 0x8;
        const int MOUSEEVENTF_RIGHTUP = 0x10;
        const int MOUSEEVENTF_MIDDLEDOWN = 0x20;
        const int MOUSEEVENTF_MIDDLEUP = 0x40;
        const int MOUSEEVENTF_WHEEL = 0x800;
        const int WHEEL_DELTA = 120;
        const int KEYEVENTF_KEYDOWN = 0x0;
        const int KEYEVENTF_KEYUP = 0x2;
        const int KEYEVENTF_EXTENDEDKEY = 0x1;
        const int MOUSEEVENTF_VIRTUALDESK = 0x4000;

        [DllImport("user32")]
        public static extern int SetCursorPos(int x, int y);

        /// <summary>
        /// Retrieves the cursor's position, in screen coordinates.
        /// </summary>
        /// <see>See MSDN documentation for further information.</see>
        [DllImport("user32")]
        private static extern bool GetCursorPos(out POINT lpPoint);

        /// <summary>
        /// 
        /// </summary>
        /// <param name="nInputs">The number of structures in the pInputs array.</param>
        /// <param name="pInputs">An array of INPUT structures. 
        /// Each structure represents 
        /// an event to be inserted into the keyboard or mouse input stream.</param>
        /// <param name="cbsize">The size, in bytes, of an INPUT structure. 
        /// If cbSize is not the size of an INPUT structure, the function fails.</param>
        [DllImport("user32")]
        private static extern void SendInput(int nInputs, ref INPUT pInputs, int cbsize);

        /// <summary>
        /// 仮想キーコードをスキャンコードに変換
        /// </summary>
        /// <param name="wCode"></param>
        /// <param name="wMapType"></param>
        /// <returns></returns>
        [DllImport("user32.dll", EntryPoint = "MapVirtualKeyA")]
        private extern static int MapVirtualKey(int wCode, int wMapType);

        [DllImport("user32.dll", SetLastError = true)]
        public extern static IntPtr GetMessageExtraInfo();

        /// <summary>
        /// Get display settings
        /// </summary>
        /// <param name="deviceName"></param>
        /// <param name="modeNum"></param>
        /// <param name="devMode"></param>
        /// <returns></returns>
        [DllImport("user32.dll")]
        private static extern bool EnumDisplaySettings(string deviceName, int modeNum, ref DEVMODE devMode);

        public static Point GetInternalWindowSize(out int state)
        {
            int enum_current_settings = -1;
            DEVMODE devmode = default;
            devmode.dmSize = (short)Marshal.SizeOf(devmode);
            bool suceed = EnumDisplaySettings(null, enum_current_settings, ref devmode);

            state = 3;
            return new Point(devmode.dmPelsWidth, devmode.dmPelsHeight);
        }

        public static Point GetCursorPos(out bool succeed)
        {
            POINT lpPoint;
            succeed = GetCursorPos(out lpPoint);

            if (succeed)
                return lpPoint;
            else // return inifity which represents an invalid number.
                return new Point(int.MaxValue, int.MaxValue);
        }

        /// <summary>
        /// 左、右、中央のマウスを押し下げる
        /// </summary>
        /// <param name="number"></param>
        public static int SetMouseButtonDown(int number)
        {
            var pos = GetCursorPos(out bool succeed);
            if (!succeed)
            {
                return -1; // 失敗ステート
            }
            try
            {
                var input = new INPUT
                {
                    type = INPUT_MOUSE,
                    ui = new INPUT_UNION
                    {
                        mouse = new MOUSEINPUT
                        {
                            dwFlags = number switch
                            {
                                0 => MOUSEEVENTF_LEFTDOWN,
                                1 => MOUSEEVENTF_MIDDLEDOWN,
                                2 => MOUSEEVENTF_RIGHTDOWN,
                                _ => throw new NotImplementedException() // Other number can't be allowed.
                            },
                            dx = pos.X,
                            dy = pos.Y,
                            mouseData = 0,
                            dwExtraInfo = GetMessageExtraInfo(),
                            time = 0
                        }
                    }
                };
                SendInput(1, ref input, Marshal.SizeOf(input));
                return 0; // 成功ステート
            }
            catch (Exception)
            {
                return -2; // 例外発生ステート
            }
        }

        /// <summary>
        /// 左、右、中央のマウスを押し下げる
        /// </summary>
        /// <param name="number"></param>
        public static int SetMouseButtonUp(int number)
        {
            var pos = GetCursorPos(out bool succeed);
            if (!succeed)
            {
                return -1; // 失敗ステート
            }
            try
            {
                var input = new INPUT
                {
                    type = INPUT_MOUSE,
                    ui = new INPUT_UNION
                    {
                        mouse = new MOUSEINPUT
                        {
                            dwFlags = number switch
                            {
                                0 => MOUSEEVENTF_LEFTUP,
                                1 => MOUSEEVENTF_MIDDLEUP,
                                2 => MOUSEEVENTF_RIGHTUP,
                                _ => throw new NotImplementedException() // Other number can't be allowed.
                            },
                            dx = pos.X,
                            dy = pos.Y,
                            mouseData = 0,
                            dwExtraInfo = GetMessageExtraInfo(),
                            time = 0
                        }
                    }
                };
                SendInput(1, ref input, Marshal.SizeOf(input)); // TODO 1->2の方へ戻した方がいいのかな？
                return 0; // 成功ステート
            }
            catch (Exception)
            {
                return -2;// 例外発生ステート
            }
        }

        public static int SetKeyDown(int keyCode)
        {
            try
            {
                short shortKeyCode = (short)keyCode;

                var input = new INPUT
                {
                    type = INPUT_KEYBOARD,
                    ui = new INPUT_UNION
                    {
                        keyboard = new KEYBDINPUT
                        {
                            wVk = shortKeyCode,
                            wScan = (short)MapVirtualKey(shortKeyCode, 0),
                            dwFlags = KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYDOWN,
                            dwExtraInfo = GetMessageExtraInfo(),
                            time = 0,
                        }
                    }
                };
                SendInput(1, ref input, Marshal.SizeOf(input));
                return 0; // 成功ステート
            }
            catch (Exception)
            {
                return -2; // 例外ステート
            }
        }

        public static int SetKeyUp(int keyCode)
        {
            try
            {
                short shortKeyCode = (short)keyCode;

                var input = new INPUT
                {
                    type = INPUT_KEYBOARD,
                    ui = new INPUT_UNION
                    {
                        keyboard = new KEYBDINPUT
                        {
                            wVk = shortKeyCode,
                            wScan = (short)MapVirtualKey(shortKeyCode, 0),
                            dwFlags = KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP,
                            dwExtraInfo = GetMessageExtraInfo(),
                            time = 0,
                        }
                    }
                };
                SendInput(1, ref input, Marshal.SizeOf(input));
                return 0; // 成功ステート
            }
            catch (Exception)
            {
                return -2; // 例外ステート
            }
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
