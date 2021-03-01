using System;
using System.IO;
using System.Threading;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Drawing;

namespace CommonizerRuler
{
    class Program
    {
        public static void Main(string[] args)
        {
            JObject data;
            while ((data = Read()) != null)
            {
                var processed = ProcessMessage(data);
                Write(processed);

                if (processed == "exit!")
                {
                    // End this app.
                    return;
                }
            }

            //string x;
            //while((x = Console.ReadLine()) != null)
            //{
            //    switch (x)
            //    {
            //        case "teleport":
            //            var size = WinInterface.GetInternalWindowSize(out int state);
            //            WinInterface.SetCursorPos(size.X / 2, size.Y / 2);
            //            Console.WriteLine("Teleport: size:" + size.ToString() + " | state:" + state);
            //            break;
            //        default:
            //            break;
            //    }
            //}
        }

        /// <summary>
        /// Read JSON data given by the commonizer web extension.
        /// </summary>
        /// <returns></returns>
        private static JObject Read()
        {
            var stdin = Console.OpenStandardInput();
            var length = 0;

            // We need to read first 4 bytes for length information -> Available total length : 4,294,967,295 ( FF FF FF FF )
            var lengthBytes = new byte[4]; 
            stdin.Read(lengthBytes, 0, 4);
            length = BitConverter.ToInt32(lengthBytes, 0);

            var buffer = new char[length];
            using (var reader = new StreamReader(stdin))
            {
                while(reader.Peek() >= 0)
                {
                    reader.Read(buffer, 0, buffer.Length);
                }
            }

            return JsonConvert.DeserializeObject<JObject>(new string(buffer));
        }

        /// <summary>
        /// Control mouse or touch or keyboard.
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        private static string ProcessMessage(JObject data)
        {
            var message = data["order"].Value<string>();
            switch (message)
            {
                case "test":
                    //WinInterface.SetCursorPos(1536, 864); // 2.5分の1, 250%分は、Winの設定項目「ディスプレイ」の「テキスト・アプリ・その他の項目のサイズ 250%」である
                    return "test!";
                case "mouse_pos":
                    var pos = WinInterface.GetCursorPos(out bool succeed);
                    var content = new JProperty("positions",
                        new JObject(
                            new JProperty("x", pos.X),
                            new JProperty("y", pos.Y)
                            ));
                    return content.ToString();
                case "set_mouse_ratio":
                    var size = WinInterface.GetInternalWindowSize(out int state);
                    var x_ratio = float.Parse(data["x_ratio"].Value<string>());
                    var y_ratio = float.Parse(data["y_ratio"].Value<string>());
                    var position = new Point(
                        (int)((float)size.X * (x_ratio)),
                        (int)((float)size.Y * (y_ratio)));
                    WinInterface.SetCursorPos(position.X, position.Y);

                    return new JProperty("positions",
                        new JObject(
                            new JProperty("state", state),
                            new JProperty("x", position.X),
                            new JProperty("y", position.Y),
                            new JProperty("size_x", size.X),
                            new JProperty("size_y", size.Y))).ToString();
                case "exit":
                    return "exit!";
                default:
                    return "echo: " + message;
            }
        }

        /// <summary>
        /// Send message to the commonizer web extension.
        /// </summary>
        /// <param name="data"></param>
        public static void Write(JToken data)
        {
            var json = new JObject();
            json["data"] = data;

            var bytes = System.Text.Encoding.UTF8.GetBytes(json.ToString(Formatting.None));

            var stdout = Console.OpenStandardOutput();
            stdout.WriteByte((byte)((bytes.Length >> 0) & 0xFF));
            stdout.WriteByte((byte)((bytes.Length >> 8) & 0xFF));
            stdout.WriteByte((byte)((bytes.Length >> 16) & 0xFF));
            stdout.WriteByte((byte)((bytes.Length >> 24) & 0xFF));
            stdout.Write(bytes, 0, bytes.Length);
            stdout.Flush();
        }
    }
}
