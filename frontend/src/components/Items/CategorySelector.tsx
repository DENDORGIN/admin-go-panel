import { FormControl, FormLabel, FormErrorMessage } from "@chakra-ui/react"
import CreatableSelect from "react-select/creatable"
import { Controller } from "react-hook-form"

type Option = { label: string; value: string }

interface CategorySelectorProps {
    control: any
    name: string
    error?: any
    options: string[]
    label?: string
    placeholder?: string
}

const normalizeLabel = (label: string) =>
    label
        .trim()
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase())

const CategorySelector = ({
                              control,
                              name,
                              error,
                              options,
                              label = "Category",
                              placeholder = "Select or create category",
                          }: CategorySelectorProps) => {
    const categoryOptions: Option[] = options.map((cat) => ({
        label: normalizeLabel(cat),
        value: cat,
    }))

    return (
        <FormControl isInvalid={!!error} mt={4}>
            <FormLabel htmlFor={name}>{label}</FormLabel>
            <Controller
                name={name}
                control={control}
                rules={{ required: "Please select or enter a category" }}
                render={({ field }) => (
                    <CreatableSelect
                        {...field}
                        options={categoryOptions}
                        placeholder={placeholder}
                        onChange={(val) => field.onChange(val?.value.trim())}
                        formatCreateLabel={(val) => `Create "${normalizeLabel(val)}"`}
                    />
                )}
            />
            {error && <FormErrorMessage>{error.message}</FormErrorMessage>}
        </FormControl>
    )
}

export default CategorySelector
