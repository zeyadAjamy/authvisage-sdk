import z from "zod";

export const clientOptionsSchema = z
  .object({
    projectId: z
      .string({
        required_error: "Project ID is required",
        invalid_type_error: "Project ID must be a string",
      })
      .uuid({
        message: "Project ID must be a valid UUID",
      }),
    platformUrl: z
      .string({
        required_error: "Platform URL is required",
        invalid_type_error: "Platform URL must be a string",
      })
      .url({ message: "Platform URL must be a valid URL" })
      .refine(
        (val) => {
          const webUrlPattern = /^https?:\/\/[^/]+/;
          return webUrlPattern.test(val);
        },
        {
          message: "Platform URL must be a valid web URL",
        }
      ),

    backendUrl: z
      .string({
        required_error: "Backend URL is required",
        invalid_type_error: "Backend URL must be a string",
      })
      .url({ message: "Backend URL must be a valid URL" })
      .refine(
        (val) => {
          const webUrlPattern = /^https?:\/\/[^/]+/;
          return webUrlPattern.test(val);
        },
        {
          message: "Backend URL must be a valid web URL",
        }
      ),
    redirectUrl: z
      .string({
        required_error: "Redirect URL is required",
        invalid_type_error: "Redirect URL must be a string",
      })
      .url({ message: "Redirect URL must be a valid URL" })
      .refine(
        (val) => {
          const webUrlPattern = /^https?:\/\/[^/]+/;
          return webUrlPattern.test(val);
        },
        {
          message: "Redirect URL must be a valid web URL",
        }
      ),
  })
  .strict({
    message: "Invalid client options structure",
  });

export type ClientOptions = z.infer<typeof clientOptionsSchema>;
