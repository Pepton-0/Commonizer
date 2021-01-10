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

        [DllImport("user32")]
        public static extern int SetCursorPos(int x, int y);

        /// <summary>
        /// Retrieves the cursor's position, in screen coordinates.
        /// </summary>
        /// <see>See MSDN documentation for further information.</see>
        [DllImport("user32")]
        public static extern bool GetCursorPos(out POINT lpPoint);

        public static Point GetCursorPos(out bool succeed)
        {
            POINT lpPoint;
            succeed = GetCursorPos(out lpPoint);

            if (succeed)
                return lpPoint;
            else
                return new Point(int.MaxValue, int.MaxValue); // return a invalid number which represents infinity.
        }
    }
}
