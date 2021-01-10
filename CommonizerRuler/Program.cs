using System;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace CommonizerRuler
{
    class Program
    {
        public static void Main(string[] args)
        {
            JObject data;
            while((data = Read()) != null)
            {
                var processed = ProcessMessage(data);
                Write(processed);

                if(processed == "exit!")
                {
                    // End this app.
                    return;
                }
            }
        }

        /// <summary>
        /// Read Json data given by the commonizer web extension.
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
            var message = data["text"].Value<string>();
            switch (message)
            {
                case "test":
                    return "testing!";
                case "ping":
                    WinInterface.SetCursorPos(600, 600);
                    return "pong!";
                case "mouse_pos":
                    var pos = WinInterface.GetCursorPos(out bool suceed);
                    var content = new JProperty("positions",
                        new JObject(
                            new JProperty("x", pos.X),
                            new JProperty("y", pos.Y)
                            ));
                    return content.ToString();
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
