using PacketDotNet.Lsa;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public static class ObjectToKVPariUtility
    {
        /// <summary>
        /// 將物件序列化為組態表示式
        /// </summary>
        /// <param name="obj">任意物件</param>
        /// <returns></returns>
        public static IEnumerable<KeyValuePair<string, string>> SerializeToKeyValuePairs(this object obj)
        {
            var result = new List<KeyValuePair<string, string>>();
            ConvertToKeyValuePairs(obj, "", result);
            return result;
        }

        private static List<KeyValuePair<string, string>> ConvertToKeyValuePairs(
            this object obj, 
            string topLevelName, 
            List<KeyValuePair<string, string>> result)
        {

            if (obj == null)
            {
                result.Add(new KeyValuePair<string, string>(
                    key: topLevelName,
                    value: null
                ));
                return result;
            }            

            var objType = obj.GetType();
            if (objType.IsValueType || objType == typeof(string) )
            {
                result.Add(new KeyValuePair<string, string>(
                        key: topLevelName,
                        value: obj.ToString()
                    ));
            } 
            else if (typeof(IEnumerable).IsAssignableFrom(objType))
            {
                var ieObj = (IEnumerable<object>)obj;
                int count = ieObj.Count();
                
                for (int i = 0; i < count; i++)
                {
                    var element = ieObj.ElementAt(i);
                    var propName = $"{topLevelName}[{i}]";                    
                    ConvertToKeyValuePairs(element, propName, result);
                }
            }
            else
            {
                var pinfos = objType.GetProperties();
                foreach (var prop in pinfos)
                {
                    var propValue = prop.GetValue(obj);
                    var splitter = string.IsNullOrEmpty(topLevelName) ? "" : ".";
                    var propName = $"{topLevelName}{splitter}{prop.Name}";
                    ConvertToKeyValuePairs(propValue, propName, result);
                }
            }

            return result;
        }

        /// <summary>
        /// 將組態表示式反序列化為指定物件類型
        /// </summary>
        /// <typeparam name="T">指定物件類型</typeparam>
        /// <param name="kvPairs">組態表示式List</param>
        /// <returns></returns>
        public static T DeserializeFromKeyValueParis<T>(this IEnumerable<KeyValuePair<string, string>> kvPairs)
        {
            var result = default(T);

            var sortedKvParis = kvPairs.OrderBy(x => x.Key);

            var objectType = typeof(T);


            if (!(objectType.IsValueType || objectType == typeof(string)))
            {
                result = (T)Activator.CreateInstance(objectType);
            }

            //result = (T)/*RuntimeHelpers.GetUninitializedObject(objectType);

            foreach (var pair in sortedKvParis)
            {
                //Tokenize
                string normalizedKey = pair.Key.Replace("[", "*[").Replace("]", "]*");
                string[] tokens = normalizedKey.Split(new char[] { '*', '.' }, StringSplitOptions.RemoveEmptyEntries);
                generateObjectByKvPair(ref result, tokens, 0, pair.Value);
            }

            return result;
        }

        private static void generateObjectByKvPair<T>(ref T obj, string[] tokens, int depth, object pathValue)
        {
            var currentToken = (depth >= tokens.Length? "": tokens[depth]);

            //有可能最上層就是null，所以要用typeof
            //typeof是Compile Time執行
            //是obj.GetType()是Runtime執行，動態產生的過程 typeof會失真 (會變成Object而非特定型別)
            //故要同時使用
            var objType = (obj == null? typeof(T): obj.GetType());

            //檢查是否為純值或字串
            if (string.IsNullOrEmpty(currentToken))
            {

                var underlyingType = Nullable.GetUnderlyingType(objType);
                if (underlyingType != null)
                {
                    if (pathValue != null)
                    {
                        obj = (T)Convert.ChangeType(pathValue, underlyingType);
                    }
                }
                else
                {
                    obj = (T)Convert.ChangeType(pathValue, objType);
                }
            }
            //檢查是否為Collection
            else if (currentToken.StartsWith('[') && currentToken.EndsWith(']'))
            {
                string strIdx = currentToken.Substring(1, currentToken.Length - 2);
                int index = int.Parse(strIdx);

                IList theObj = (IList)obj;



                var theElementType = obj.GetType().GenericTypeArguments[0];

                var nextLevelObj = (
                                        //檢查是不是Token路徑的最後一層，若值為null，則設定為null
                                        (tokens.Length == (depth + 1) && pathValue == null)? 
                                        null:
                                        //否則檢查是否有產生過Instance，若有則抓已產生的，若沒有則產生一個新的
                                        (theObj.Count == (index + 1)? theObj[index]: Activator.CreateInstance(theElementType))
                                   );
                if (theObj.Count < (index + 1))
                {
                    theObj.Add(nextLevelObj);
                }

                if (nextLevelObj != null)
                {
                    generateObjectByKvPair(ref nextLevelObj, tokens, ++depth, pathValue);
                }
            }
            //一般含有屬性的物件
            else
            {
                var propInfos = objType.GetProperties();
                var prop = propInfos.FirstOrDefault(x => x.Name == currentToken);
                //KeyName不存在Model屬性Names中，則跳脫
                if (prop == null)
                {
                    return;
                }

                //檢查是不是Token路徑的最後一層，若是則設定屬性值
                if (tokens.Length == (depth + 1))
                {
                    var propUnderlyingType = Nullable.GetUnderlyingType(prop.PropertyType);
                    if (propUnderlyingType != null)
                    {
                        if (pathValue != null)
                        {
                            prop.SetValue(obj, Convert.ChangeType(pathValue, propUnderlyingType));
                        }                        
                    }
                    else
                    {
                        prop.SetValue(obj, Convert.ChangeType(pathValue, prop.PropertyType));
                    }
                }
                //否則檢查屬性目前是不是為null，若是，則產生一個新的，並且往下一層建構
                else
                {
                    var nextLevelObj = prop.GetValue(obj, null);
                    if (nextLevelObj == null)
                    {
                        nextLevelObj = Activator.CreateInstance(prop.PropertyType);
                        prop.SetValue(obj, nextLevelObj);
                    }
                    generateObjectByKvPair(ref nextLevelObj, tokens, ++depth, pathValue);
                }                
            }
        }
    }
}
