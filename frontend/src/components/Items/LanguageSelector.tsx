import { FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/react"
import CreatableSelect from "react-select/creatable"
import { Controller } from "react-hook-form"

type Option = { label: string; value: string }

interface LanguageSelectorProps {
    control: any
    name: string
    error?: any
    options: string[]
    label?: string
    placeholder?: string
}

const LanguageSelector = ({
                              control,
                              name,
                              error,
                              options,
                              label = "Language",
                              placeholder = "Select or type language",
                          }: LanguageSelectorProps) => {
    const languageOptions: Option[] = options.map((lang) => ({
        label: lang.toUpperCase(),
        value: lang,
    }))

    return (
        <FormControl isInvalid={!!error} mt={4}>
            <FormLabel htmlFor={name}>{label}</FormLabel>
            <Controller
                name={name}
                control={control}
                rules={{ required: "Please select or enter a language" }}
                render={({ field }) => (
                    <CreatableSelect
                        {...field}
                        options={languageOptions}
                        placeholder={placeholder}
                        onChange={(val) => field.onChange(val?.value.toLowerCase())}
                    />
                )}
            />
            {error && <FormErrorMessage>{error.message}</FormErrorMessage>}
        </FormControl>
    )
}

export default LanguageSelector
