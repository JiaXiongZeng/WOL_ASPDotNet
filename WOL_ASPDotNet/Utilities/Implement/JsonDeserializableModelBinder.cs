using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Text.Json;

namespace WOL_ASPDotNet.Utilities.Implement
{
    public class JsonDeserializableModelBinder : IModelBinder
    {
        public Task BindModelAsync(ModelBindingContext bindingContext)
        {
            var valueProviderResult = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);
            var valueType = bindingContext.ModelType;

            var value = valueProviderResult.FirstValue; // get the value as string


            if (value == null)
            {
                bindingContext.Result = ModelBindingResult.Success(null);
            }
            else
            {
                var model = JsonSerializer.Deserialize(value, valueType);
                bindingContext.Result = ModelBindingResult.Success(model);
            }

            return Task.CompletedTask;
        }
    }
}
