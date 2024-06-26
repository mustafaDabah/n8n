<script setup lang="ts">
import { isEqual } from 'lodash-es';

import {
	type FilterConditionValue,
	type FilterValue,
	type INodeProperties,
	type FilterTypeCombinator,
	type INode,
	type NodeParameterValue,
	type FilterOptionsValue,
} from 'n8n-workflow';
import { computed, reactive, watch } from 'vue';
import { useNDVStore } from '@/stores/ndv.store';
import {
	DEFAULT_FILTER_OPTIONS,
	DEFAULT_MAX_CONDITIONS,
	DEFAULT_OPERATOR_VALUE,
} from './constants';
import { useI18n } from '@/composables/useI18n';
import { useDebounceHelper } from '@/composables/useDebounce';
import Condition from './Condition.vue';
import CombinatorSelect from './CombinatorSelect.vue';
import { resolveParameter } from '@/mixins/workflowHelpers';
import { v4 as uuid } from 'uuid';

interface Props {
	parameter: INodeProperties;
	value: FilterValue;
	path: string;
	node: INode | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	(event: 'valueChanged', value: { name: string; node: string; value: FilterValue }): void;
}>();

const i18n = useI18n();
const ndvStore = useNDVStore();
const { callDebounced } = useDebounceHelper();

function createCondition(): FilterConditionValue {
	return { id: uuid(), leftValue: '', rightValue: '', operator: DEFAULT_OPERATOR_VALUE };
}

const allowedCombinators = computed<FilterTypeCombinator[]>(
	() => props.parameter.typeOptions?.filter?.allowedCombinators ?? ['and', 'or'],
);

const state = reactive<{ paramValue: FilterValue }>({
	paramValue: {
		options: props.value?.options ?? DEFAULT_FILTER_OPTIONS,
		conditions: props.value?.conditions ?? [createCondition()],
		combinator: props.value?.combinator ?? allowedCombinators.value[0],
	},
});

const maxConditions = computed(
	() => props.parameter.typeOptions?.filter?.maxConditions ?? DEFAULT_MAX_CONDITIONS,
);

const maxConditionsReached = computed(
	() => maxConditions.value <= state.paramValue.conditions.length,
);

const issues = computed(() => {
	if (!ndvStore.activeNode) return {};
	return ndvStore.activeNode?.issues?.parameters ?? {};
});

watch(
	() => props.node?.parameters,
	() => {
		const typeOptions = props.parameter.typeOptions?.filter;

		if (!typeOptions) {
			return;
		}

		let newOptions: FilterOptionsValue = DEFAULT_FILTER_OPTIONS;
		try {
			newOptions = {
				...DEFAULT_FILTER_OPTIONS,
				...resolveParameter(typeOptions as NodeParameterValue),
			};
		} catch (error) {}

		if (!isEqual(state.paramValue.options, newOptions)) {
			state.paramValue.options = newOptions;
		}
	},
	{ immediate: true },
);

watch(state.paramValue, (value) => {
	void callDebounced(
		() => {
			emit('valueChanged', { name: props.path, value, node: props.node?.name as string });
		},
		{ debounceTime: 1000 },
	);
});

function addCondition(): void {
	state.paramValue.conditions.push(createCondition());
}

function onConditionUpdate(index: number, value: FilterConditionValue): void {
	state.paramValue.conditions[index] = value;
}

function onCombinatorChange(combinator: FilterTypeCombinator): void {
	state.paramValue.combinator = combinator;
}

function onConditionRemove(index: number): void {
	state.paramValue.conditions.splice(index, 1);
}

function getIssues(index: number): string[] {
	return issues.value[`${props.parameter.name}.${index}`] ?? [];
}
</script>

<template>
	<div :class="$style.filter" :data-test-id="`filter-${parameter.name}`">
		<n8n-input-label
			:label="parameter.displayName"
			:underline="true"
			:show-options="true"
			:show-expression-selector="false"
			color="text-dark"
		>
		</n8n-input-label>
		<div :class="$style.content">
			<div :class="$style.conditions">
				<div v-for="(condition, index) of state.paramValue.conditions" :key="condition.id">
					<CombinatorSelect
						v-if="index !== 0"
						:read-only="index !== 1"
						:options="allowedCombinators"
						:selected="state.paramValue.combinator"
						:class="$style.combinator"
						@combinatorChange="onCombinatorChange"
					/>

					<Condition
						:condition="condition"
						:index="index"
						:options="state.paramValue.options"
						:fixed-left-value="!!parameter.typeOptions?.filter?.leftValue"
						:can-remove="index !== 0 || state.paramValue.conditions.length > 1"
						:path="`${path}.${index}`"
						:issues="getIssues(index)"
						@update="(value) => onConditionUpdate(index, value)"
						@remove="() => onConditionRemove(index)"
					></Condition>
				</div>
			</div>
			<div :class="$style.addConditionWrapper">
				<n8n-button
					type="tertiary"
					block
					:class="$style.addCondition"
					:label="i18n.baseText('filter.addCondition')"
					:title="maxConditionsReached ? i18n.baseText('filter.maxConditions') : ''"
					:disabled="maxConditionsReached"
					data-test-id="filter-add-condition"
					@click="addCondition"
				/>
			</div>
		</div>
	</div>
</template>

<style lang="scss" module>
.filter {
	display: flex;
	flex-direction: column;
	margin: var(--spacing-xs) 0;
}

.conditions {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-4xs);
}
.combinator {
	position: relative;
	z-index: 1;
	margin-top: var(--spacing-2xs);
	margin-bottom: calc(var(--spacing-2xs) * -1);
	margin-left: var(--spacing-l);
}

.addConditionWrapper {
	margin-top: var(--spacing-l);
	margin-left: var(--spacing-l);
}

.addCondition {
	// Styling to match collection button (should move to standard button in future)
	font-weight: var(--font-weight-normal);
	--button-font-color: var(--color-text-dark);
	--button-border-color: var(--color-foreground-base);
	--button-background-color: var(--color-background-base);

	--button-hover-font-color: var(--color-text-dark);
	--button-hover-border-color: var(--color-foreground-base);
	--button-hover-background-color: var(--color-background-base);

	--button-active-font-color: var(--color-text-dark);
	--button-active-border-color: var(--color-foreground-base);
	--button-active-background-color: var(--color-background-base);

	--button-focus-font-color: var(--color-text-dark);
	--button-focus-border-color: var(--color-foreground-base);
	--button-focus-background-color: var(--color-background-base);

	&:hover,
	&:focus,
	&:active {
		outline: none;
	}
}
</style>
